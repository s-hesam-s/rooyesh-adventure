"""Check exact reviewed package versions against GitHub's public advisory API."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import subprocess
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


class SameHostRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        if urlsplit(newurl).scheme != 'https' or urlsplit(newurl).netloc != 'api.github.com':
            raise ValueError('Unexpected advisory API redirect.')
        return super().redirect_request(request, fp, code, msg, headers, newurl)


def load_packages(root):
    root = root.resolve()
    manifest = json.loads((root / 'docs/runtime-advisories.json').read_text(encoding='utf-8'))
    packages = manifest.get('packages', [])
    if not packages:
        raise ValueError('No runtime packages are registered.')
    seen = set()
    for package in packages:
        name, version = package['name'], package['version']
        if not re.fullmatch(r'(?:@[a-z0-9._-]+/)?[a-z0-9][a-z0-9._-]*', name):
            raise ValueError('Invalid npm package name.')
        if not re.fullmatch(r'\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?', version):
            raise ValueError('Runtime versions must be exact.')
        if name in seen:
            raise ValueError('Duplicate runtime package.')
        seen.add(name)
        for path in package.get('files', []):
            file = (root / path).resolve()
            if not file.is_relative_to(root):
                raise ValueError('Runtime file leaves repository.')
            if file.is_file():
                content = file.read_bytes()
            else:
                try:
                    content = subprocess.check_output(['git', '--no-optional-locks', 'show', 'HEAD:' + path], cwd=root, stderr=subprocess.DEVNULL)
                except subprocess.CalledProcessError as error:
                    raise ValueError('Missing registered runtime file: ' + path) from error
            expected_hash = package.get('sha256LF', {}).get(path)
            if expected_hash and hashlib.sha256(content.replace(b'\r\n', b'\n')).hexdigest() != expected_hash:
                raise ValueError('Registered runtime bytes changed: ' + path)
    inventory = root / 'docs/frontend-dependencies.json'
    if inventory.exists():
        reviewed = json.loads(inventory.read_text(encoding='utf-8'))
        covered = {url for package in packages for url in package.get('resources', [])}
        expected = {r['url'] for r in reviewed['remoteResources']}
        expected = {u for u in expected if urlsplit(u).hostname != 'fonts.googleapis.com'}
        if covered != expected:
            raise ValueError('Advisory inventory differs from reviewed CDN resources.')
    return packages


def query_package(package, opener=None):
    opener = opener or build_opener(SameHostRedirect())
    headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'runtime-advisory-check',
               'X-GitHub-Api-Version': '2022-11-28'}
    token = os.environ.get('GITHUB_TOKEN')
    if token:
        headers['Authorization'] = 'Bearer ' + token
    results = []
    affects = package['name'] + '@' + package['version']
    query = urlencode({'ecosystem': 'npm', 'type': 'reviewed', 'is_withdrawn': 'false',
                       'affects': affects, 'per_page': 100})
    url = 'https://api.github.com/advisories?' + query
    for _ in range(20):
        request = Request(url, headers=headers)
        with opener.open(request, timeout=30) as response:
            data = json.load(response)
            link = response.headers.get('Link', '')
        if not isinstance(data, list):
            raise ValueError('Unexpected advisory API response.')
        for advisory in data:
            if not isinstance(advisory, dict) or not advisory.get('ghsa_id'):
                raise ValueError('Malformed advisory API response.')
            if not advisory.get('withdrawn_at'):
                results.append({'id': advisory['ghsa_id'], 'severity': advisory.get('severity', 'unknown')})
        next_link = re.search(r'<([^>]+)>;\s*rel="next"', link)
        if not next_link:
            return results
        url = next_link[1]
        parsed = urlsplit(url)
        params = parse_qs(parsed.query)
        if (parsed.scheme != 'https' or parsed.netloc != 'api.github.com'
                or parsed.path != '/advisories' or params.get('affects') != [affects]
                or params.get('ecosystem') != ['npm'] or params.get('type') != ['reviewed']):
            raise ValueError('Unexpected advisory pagination URL.')
    raise ValueError('Advisory pagination exceeded its safety limit.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--offline', action='store_true', help='Validate inventory without API access.')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    try:
        packages = load_packages(root)
        if args.offline:
            print('PASS: exact runtime advisory inventory and CDN coverage')
            return 0
        findings = []
        for package in packages:
            for advisory in query_package(package):
                findings.append(package['name'] + '@' + package['version'] + ': '
                                + advisory['id'] + ' (' + advisory['severity'] + ')')
        for finding in findings:
            print(finding)
        if findings:
            return 1
        print('PASS: no active reviewed advisories for ' + str(len(packages)) + ' exact runtime versions')
        return 0
    except (ValueError, KeyError, OSError, HTTPError, URLError, json.JSONDecodeError) as error:
        # Do not print request headers, token values or remote response bodies.
        label = 'HTTP ' + str(error.code) if isinstance(error, HTTPError) else type(error).__name__
        print('FAIL: advisory check could not complete (' + label + ').', file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
