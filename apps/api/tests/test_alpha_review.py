import io
from PIL import Image
from powwow.production import alpha_review_preview


def test_review_preview_renders_alpha_instead_of_hidden_rgb():
    picture = Image.new('RGBA', (64, 64), (255, 0, 0, 0))
    picture.putpixel((32, 32), (10, 20, 30, 255))
    data = io.BytesIO(); picture.save(data, 'PNG')
    original = data.getvalue()
    rendered = Image.open(io.BytesIO(alpha_review_preview(original)))
    assert rendered.mode == 'RGB'
    assert rendered.getpixel((0, 0)) == (232, 232, 232)
    assert rendered.getpixel((32, 32)) == (10, 20, 30)
    assert Image.open(io.BytesIO(original)).getpixel((0, 0)) == (255, 0, 0, 0)
