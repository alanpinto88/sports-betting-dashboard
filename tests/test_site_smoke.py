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
        self.assertIn("summary.append(addText",scanner)
        self.assertIn("d.append(summary,selectionRow,inner)",scanner)
        self.assertIn("groupSelectLabel",scanner)

    def test_comparison_requires_two_valid_prices(self):
        research=(ROOT/"research.html").read_text(encoding="utf-8")
        self.assertIn("rows.length<2",research)
        self.assertIn("Example prices",research)
        self.assertIn("Manually entered prices are unverified",research)
        self.assertIn("Additional potential profit if the selection wins",research)

    def test_safari_group_checkbox_outside_summary(self):
        scanner=(ROOT/"scanner.html").read_text(encoding="utf-8")
        section=scanner.split("function groupedChoices(",1)[1].split("function drawChecks(",1)[0]
        self.assertIn("summary.append(addText",section)
        self.assertIn("groupLabel.append(cb",section)
        self.assertIn("d.append(summary,selectionRow,inner)",section)
        self.assertNotIn("summary.append(cb",section)

    def test_bet_export_is_local_and_formula_safe(self):
        home=(ROOT/"index.html").read_text(encoding="utf-8")
        self.assertIn("function csvCell(value)",home)
        self.assertIn(r"/^[\s]*[=+@-]/",home)
        self.assertIn("'profit'",home)
        self.assertIn("key==='profit'?pnl(bet):bet[key]",home)
        self.assertIn("URL.createObjectURL(blob)",home)

    def test_local_storage_failure_is_visible(self):
        home=(ROOT/"index.html").read_text(encoding="utf-8")
        self.assertIn("function save(){try{",home)
        self.assertIn("Browser storage is unavailable or full",home)
        self.assertNotIn(r"grid-template-columns:1fr}}\\n</style>",home)

    def test_single_recent_review_refresh_listener(self):
        home=(ROOT/"index.html").read_text(encoding="utf-8")
        self.assertEqual(home.count("el('refreshAuto').addEventListener('click',loadRecentReviews)"),1)

    def test_bet_roi_uses_settled_stakes_only(self):
        home=(ROOT/"index.html").read_text(encoding="utf-8")
        self.assertIn("let settled=bets.filter(b=>b.status!=='pending')",home)
        self.assertIn("staked=settled.reduce",home)

    def test_bet_ledger_filter_does_not_change_export_or_metrics(self):
        home=(ROOT/"index.html").read_text(encoding="utf-8")
        self.assertIn('id="betView"',home)
        self.assertIn("visibleBets=bets.filter(",home)
        self.assertIn("betView==='settled'?b.status!=='pending'",home)
        self.assertIn("visibleBets.map(b=>",home)
        self.assertIn("el('betView').addEventListener('change',render)",home)
        self.assertIn("for(const bet of bets)lines.push(",home)
        self.assertIn("let settled=bets.filter(",home)

    def test_structured_bet_metadata_for_future_settlement(self):
        home=(ROOT/"index.html").read_text(encoding="utf-8")
        for control in ("betBook","betGameId","betHomeTeam","betAwayTeam","betMarket","betSide","betLine"):
            self.assertIn('id="'+control+'"',home)
        for market in ("moneyline","spread","total","player_prop"):
            self.assertIn('value="'+market+'"',home)
        self.assertIn("providerGameId:el('betGameId').value.trim()",home)
        self.assertIn("settlementSource:'manual'",home)
        self.assertIn("rawLine===''?null:Number(rawLine)",home)
        self.assertIn("'providerGameId','homeTeam','awayTeam','market','side','line','settlementSource'",home)
        self.assertIn("manually entered, not automatically settled",home)

    def test_settlement_preview_is_non_binding(self):
        home=(ROOT/"index.html").read_text(encoding="utf-8")
        for control in ("settleBet","settleHome","settleAway","previewSettlement","settlementPreview"):
            self.assertIn('id="'+control+'"',home)
        self.assertIn("function standardSettlement(b,home,away)",home)
        self.assertIn("if(home===away)return null",home)
        self.assertIn("return 'push'",home)
        self.assertIn("Confirm official results and sportsbook rules",home)
        self.assertIn("does not change saved bets",home)
        self.assertNotIn("b.status=result",home)

    def test_nhl_final_lookup_requires_exact_game_id_and_is_read_only(self):
        home=(ROOT/"index.html").read_text(encoding="utf-8")
        self.assertIn('id="fetchNhlFinal"',home)
        self.assertIn(r"/^\d{10}$/",home)
        self.assertIn("!['OFF','FINAL'].includes(game.gameState)",home)
        self.assertIn("String(game.id)!==String(b.providerGameId)",home)
        self.assertIn("api-web.nhle.com/v1/gamecenter/",home)
        self.assertIn("Not applied to bet",home)
        self.assertIn("b.homeTeam!==home.abbrev||b.awayTeam!==away.abbrev",home)
        self.assertIn("Team codes missing or do not match",home)
        self.assertNotIn("b.status=preview",home)
        self.assertIn("The NHL web API may block cross-origin browser requests",home)
        self.assertIn("Selected bet changed. Enter or retrieve its final score",home)

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
