import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock

spec = importlib.util.spec_from_file_location('advisory_check', Path(__file__).resolve().parents[1] / 'scripts/check_advisories.py')
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)


class Response(io.StringIO):
    def __init__(self, value, link=''):
        super().__init__(json.dumps(value))
        self.headers = {'Link': link}


class AdvisoryTests(unittest.TestCase):
    def test_active_advisory_blocks_and_withdrawn_does_not(self):
        opener = Mock()
        opener.open.return_value = Response([
            {'ghsa_id': 'GHSA-active', 'severity': 'high', 'withdrawn_at': None},
            {'ghsa_id': 'GHSA-withdrawn', 'withdrawn_at': '2026-01-01'}])
        self.assertEqual(check.query_package({'name': 'jquery', 'version': '1.8.0'}, opener),
                         [{'id': 'GHSA-active', 'severity': 'high'}])

    def test_package_version_is_encoded_in_request(self):
        opener = Mock()
        opener.open.return_value = Response([])
        check.query_package({'name': '@tiptap/core', 'version': '3.32.0'}, opener)
        request = opener.open.call_args.args[0]
        self.assertIn('affects=%40tiptap%2Fcore%403.32.0', request.full_url)

    def test_api_error_payload_is_not_a_clean_result(self):
        opener = Mock()
        opener.open.return_value = Response({'message': 'API rate limit exceeded'})
        with self.assertRaises(ValueError):
            check.query_package({'name': 'jquery', 'version': '3.6.0'}, opener)

    def test_malformed_advisory_is_rejected(self):
        opener = Mock()
        opener.open.return_value = Response([{'summary': 'missing identifier'}])
        with self.assertRaises(ValueError):
            check.query_package({'name': 'jquery', 'version': '3.6.0'}, opener)

    def test_pagination_keeps_affected_version_filter(self):
        opener = Mock()
        next_url = 'https://api.github.com/advisories?ecosystem=npm&type=reviewed&affects=jquery%403.6.0&after=cursor'
        opener.open.side_effect = [Response([], '<' + next_url + '>; rel="next"'),
                                   Response([{'ghsa_id': 'GHSA-on-next-page'}])]
        self.assertEqual(check.query_package({'name': 'jquery', 'version': '3.6.0'}, opener)[0]['id'], 'GHSA-on-next-page')

    def test_pagination_cannot_send_token_to_another_host(self):
        opener = Mock()
        opener.open.return_value = Response([], '<https://example.com/advisories>; rel="next"')
        with self.assertRaises(ValueError):
            check.query_package({'name': 'jquery', 'version': '3.6.0'}, opener)
        self.assertEqual(opener.open.call_count, 1)

    def test_external_redirect_is_rejected(self):
        with self.assertRaises(ValueError):
            check.SameHostRedirect().redirect_request(None, None, 302, '', {}, 'https://example.com/')

    def test_floating_version_cannot_pass_offline_inventory(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'docs').mkdir()
            (root / 'docs/runtime-advisories.json').write_text(json.dumps({'packages': [{'name': 'jquery', 'version': '^3.6.0'}]}), encoding='utf-8')
            with self.assertRaises(ValueError):
                check.load_packages(root)

    def test_added_cdn_resource_requires_advisory_mapping(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'docs').mkdir()
            (root / 'docs/runtime-advisories.json').write_text(json.dumps({'packages': [{'name': 'jquery', 'version': '3.6.0', 'resources': []}]}), encoding='utf-8')
            (root / 'docs/frontend-dependencies.json').write_text(json.dumps({'remoteResources': [{'url': 'https://code.jquery.com/jquery-3.6.0.min.js'}]}), encoding='utf-8')
            with self.assertRaises(ValueError):
                check.load_packages(root)


if __name__ == '__main__':
    unittest.main()
