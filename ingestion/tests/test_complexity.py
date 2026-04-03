from ingestion.complexity import load_model


def test_load_model():
    nlp = load_model("en_core_web_md")
    assert nlp is not None
    assert nlp.meta["name"] == "core_web_md"
