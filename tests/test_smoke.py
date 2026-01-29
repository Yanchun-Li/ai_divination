from ai_divination.app import main


def test_main_smoke(capsys):
    assert main() == 0
    captured = capsys.readouterr()
    assert "AI Divination" in captured.out
