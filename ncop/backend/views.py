from django.http import JsonResponse
import json
from pathlib import Path
from django.conf import settings


def index_json(request):
    index_file = Path(settings.BASE_DIR) / "backend" / "static" / "index.json"
    with open(index_file) as f:
        data = json.load(f)
    return JsonResponse(data)
