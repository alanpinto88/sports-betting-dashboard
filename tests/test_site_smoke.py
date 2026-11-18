"""Offline smoke checks for EV Sports public pages and published data.

Run with: python -m unittest discover -s tests
No network, credentials, or paid API requests.
"""
import json
import re
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

class PublicSiteSmokeTests(unittest.TestCase):
    def test_pages_exist(self):
        for name in ("index.html","scanner.html","research.html"):
            with self.subTest(page=name):
                self.assertTrue((ROOT/name).is_file())

    def test_navigation_and_research_tools(self):
        home=(ROOT/"index.html").read_text(encoding="utf-8")
        scanner=(ROOT/"scanner.html").read_text(encoding="utf-8")
        research=(ROOT/"research.html").read_text(encoding="utf-8")
        self.assertIn("research.html",home)
        self.assertIn("exportBets",home)
        self.assertIn("csvCell",home)
        self.assertIn("research.html",scanner)
        self.assertIn("scanner.html",research)
        for tool in ("evOdds","vigA","arbA","kellyOdds","feeds","compareOddsA","compareOddsB","compareOddsC","compareResult"):
            self.assertIn('id="'+tool+'"',research)

    def test_filter_controls_remain_present(self):
        scanner=(ROOT/"scanner.html").read_text(encoding="utf-8")
        for control in ("leagues","books","markets","save","toggleFilters"):
            self.assertIn('id="'+control+'"',scanner)
        self.assertIn("groupedChoices('books'",scanner)
        self.assertIn("cb.disabled=false",scanner)

    def test_no_unverified_feed_picks(self):
        for filename in ("recent-market-review.json","nba-player-props-review.json"):
            path=ROOT/filename
            if not path.exists():
                continue
            feed=json.loads(path.read_text(encoding="utf-8"))
            self.assertIsInstance(feed.get("signals"),list)
            self.assertIn("captured_at",feed)
            self.assertIn("diagnostics",feed)
            for signal in feed["signals"]:
                self.assertIn("captured_at",signal)
                self.assertIn("reference_probability",signal)
                self.assertIn("reference_books",signal)

if __name__=="__main__":
    unittest.main()
