#!/usr/bin/env python3
"""
High-accuracy PDF service extractor using PyMuPDF.
Designed for Swiss stable service catalogs (Italian/German).

@module scripts/pdf_parser
@description PyMuPDF-based PDF parsing for service extraction
@safety RED
"""
import fitz  # PyMuPDF
import json
import sys
import re
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict

# Column headers (Italian/German)
COLUMN_HEADERS = {
    'name': ['PRESTAZIONE', 'SERVIZIO', 'PRESTAZIONE / SERVIZIO', 'PRESTAZIONE/SERVIZIO',
             'LEISTUNG', 'DIENSTLEISTUNG', 'SERVICE'],
    'duration': ['DURATA', 'Durata', 'DAUER', 'ZEITRAUM'],
    'price': ['PREZZO', 'Prezzo', 'PREIS', 'PRICE', 'CHF'],
    'tax': ['IVA', '+ IVA', '+IVA', 'MWST', 'TVA']
}

# Swiss tax rates
TAX_RATES = {
    '8.1': 0.081,
    '8,1': 0.081,
    '8.1%': 0.081,
    '8,1%': 0.081,
    '2.6': 0.026,
    '2,6': 0.026,
    '2.6%': 0.026,
    '2,6%': 0.026,
    '3.8': 0.038,
    '3,8': 0.038,
    '3.8%': 0.038,
    '3,8%': 0.038,
}

# Billing unit patterns (Italian/German)
BILLING_PATTERNS = {
    'monthly': [
        r'al\s+mese', r'mensile', r'per\s+mese', r'/\s*mese',
        r'pro\s+monat', r'monatlich', r'/\s*monat', r'mtl\.?'
    ],
    'per_session': [
        r'al\s+giorno', r'per\s+giorno', r'/\s*giorno', r'giornalier[oa]',
        r'pro\s+tag', r'täglich', r'/\s*tag',
        r'per\s+ora', r'all\'?\s*ora', r'/\s*ora',
        r'pro\s+stunde', r'/\s*stunde',
        r'lezione', r'per\s+lezione', r'/\s*lezione',
        r'pro\s+lektion', r'/\s*lektion'
    ]
}


@dataclass
class ParsedService:
    name: str
    price_cents: int
    billing_unit: str
    tax_rate: Optional[float]
    duration_text: Optional[str]
    notes: Optional[str]
    confidence: float


def parse_swiss_price(price_str: str) -> Optional[int]:
    """
    Parse Swiss currency formats to cents.

    Examples:
        CHF 1'365.00 -> 136500
        CHF 850.– -> 85000
        1.365,00 -> 136500 (European format)
        Fr. 25.00 -> 2500
    """
    if not price_str:
        return None

    # Remove currency indicators, whitespace, and normalize
    cleaned = re.sub(r"(CHF|Fr\.|SFr\.?|€|\$)", '', price_str, flags=re.IGNORECASE)
    cleaned = cleaned.strip()

    # Remove Swiss thousands separator (apostrophe)
    cleaned = cleaned.replace("'", "")

    # Handle trailing dash notation (e.g., 850.– means 850.00)
    cleaned = re.sub(r'[.–—-]+$', '', cleaned)

    # Detect format by separator positions
    last_comma = cleaned.rfind(',')
    last_dot = cleaned.rfind('.')

    if last_comma > last_dot:
        # European format: 1.234,56 -> comma is decimal
        cleaned = cleaned.replace('.', '').replace(',', '.')
    elif last_dot > last_comma:
        # Swiss/US format: 1,234.56 or 1234.56 -> dot is decimal
        cleaned = cleaned.replace(',', '')
    elif last_comma != -1:
        # Only comma: check digits after
        parts = cleaned.split(',')
        if len(parts) == 2 and len(parts[1]) <= 2:
            cleaned = cleaned.replace(',', '.')
        else:
            cleaned = cleaned.replace(',', '')

    # Remove any remaining non-numeric except dot
    cleaned = re.sub(r'[^\d.]', '', cleaned)

    try:
        value = float(cleaned)
        return int(round(value * 100))
    except (ValueError, TypeError):
        return None


def detect_billing_unit(text: str) -> Tuple[str, Optional[str]]:
    """
    Detect billing unit from duration/description text.
    Returns (billing_unit, duration_text).
    """
    text_lower = text.lower()

    for unit, patterns in BILLING_PATTERNS.items():
        for pattern in patterns:
            match = re.search(pattern, text_lower)
            if match:
                return unit, match.group(0)

    return 'one_time', None


def parse_tax_rate(tax_str: str) -> Optional[float]:
    """Parse tax rate from IVA/MWST column."""
    if not tax_str:
        return None

    cleaned = tax_str.strip()

    # Direct lookup
    for rate_str, rate_val in TAX_RATES.items():
        if rate_str in cleaned:
            return rate_val

    # Try extracting number
    match = re.search(r'(\d+[.,]\d+)', cleaned)
    if match:
        rate_str = match.group(1)
        if rate_str in TAX_RATES:
            return TAX_RATES[rate_str]
        # Try converting directly
        try:
            rate = float(rate_str.replace(',', '.'))
            if 0 < rate < 100:
                return rate / 100 if rate > 1 else rate
        except ValueError:
            pass

    return None


def cluster_spans_by_y(spans: List[Dict], threshold: float = 8.0) -> List[List[Dict]]:
    """
    Group text spans by y-coordinate into rows.
    Spans within `threshold` pixels are considered same row.
    """
    if not spans:
        return []

    # Sort by y position
    sorted_spans = sorted(spans, key=lambda s: s['y0'])

    rows = []
    current_row = [sorted_spans[0]]
    current_y = sorted_spans[0]['y0']

    for span in sorted_spans[1:]:
        if abs(span['y0'] - current_y) <= threshold:
            current_row.append(span)
        else:
            rows.append(sorted(current_row, key=lambda s: s['x0']))
            current_row = [span]
            current_y = span['y0']

    if current_row:
        rows.append(sorted(current_row, key=lambda s: s['x0']))

    return rows


def extract_text_spans(page) -> List[Dict]:
    """Extract all text spans with position data from a page."""
    spans = []
    blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]

    for block in blocks:
        if block.get("type") != 0:  # Skip non-text blocks
            continue

        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                if text:
                    spans.append({
                        "text": text,
                        "x0": span["bbox"][0],
                        "y0": span["bbox"][1],
                        "x1": span["bbox"][2],
                        "y1": span["bbox"][3],
                        "font_size": span.get("size", 0),
                        "font": span.get("font", "")
                    })

    return spans


def detect_column_boundaries(rows: List[List[Dict]]) -> Dict[str, Tuple[float, float]]:
    """
    Detect column boundaries from header row.
    Returns dict mapping column type to (x_min, x_max) range.
    """
    columns = {}

    # Find header row by looking for known column headers
    for row in rows[:10]:  # Check first 10 rows for headers
        row_text = ' '.join(s['text'] for s in row).upper()

        for col_type, headers in COLUMN_HEADERS.items():
            for header in headers:
                if header.upper() in row_text:
                    # Find the span containing this header
                    for span in row:
                        if header.upper() in span['text'].upper():
                            # Use span boundaries as column hint
                            if col_type not in columns:
                                columns[col_type] = (span['x0'] - 10, span['x1'] + 100)
                            break

    return columns


def is_likely_service_name(text: str) -> bool:
    """Check if text looks like a service name (not a header or number)."""
    if not text or len(text) < 3:
        return False

    # Skip if it's all numbers/punctuation
    if re.match(r'^[\d\s.,\-–—/\'\"]+$', text):
        return False

    # Skip common non-service text
    skip_patterns = [
        r'^(tot|total|subtot|summe|somma)',
        r'^(iva|mwst|tva|tax)',
        r'^(chf|eur|usd|fr\.)',
        r'^(pagina|page|seite)',
        r'^\d+[.,]\d+%?$',  # Tax rates, percentages
    ]

    text_lower = text.lower().strip()
    for pattern in skip_patterns:
        if re.match(pattern, text_lower):
            return False

    # Should start with a letter
    return text[0].isalpha()


def extract_row_data(row: List[Dict], columns: Dict, page_width: float) -> Optional[Dict]:
    """
    Extract service data from a row using column boundaries.
    """
    if not row:
        return None

    # Combine adjacent spans that might be split
    combined_text = []
    current_text = row[0]['text']
    current_x0 = row[0]['x0']
    current_x1 = row[0]['x1']

    for span in row[1:]:
        # If span is close to previous, combine them
        if span['x0'] - current_x1 < 20:
            current_text += ' ' + span['text']
            current_x1 = span['x1']
        else:
            combined_text.append({
                'text': current_text.strip(),
                'x0': current_x0,
                'x1': current_x1
            })
            current_text = span['text']
            current_x0 = span['x0']
            current_x1 = span['x1']

    combined_text.append({
        'text': current_text.strip(),
        'x0': current_x0,
        'x1': current_x1
    })

    # Extract fields based on position
    name = None
    price_text = None
    duration_text = None
    tax_text = None

    for item in combined_text:
        text = item['text']
        x_center = (item['x0'] + item['x1']) / 2
        rel_pos = x_center / page_width  # Relative position (0-1)

        # Try to match CHF/price pattern first
        if re.search(r'CHF|Fr\.|SFr|€|\d+[\'.,]\d+', text, re.IGNORECASE):
            price_match = re.search(r'(?:CHF|Fr\.|SFr\.?|€)?\s*[\d\'.,]+(?:[.–—-]|(?:\d{2}))?', text, re.IGNORECASE)
            if price_match:
                price_text = price_match.group(0)
                # If there's text before the price, it might be the name
                remaining = text[:price_match.start()].strip()
                if remaining and is_likely_service_name(remaining):
                    name = remaining
                continue

        # Check for tax rate
        if re.search(r'\d+[.,]\d+\s*%|IVA|MWST|TVA', text, re.IGNORECASE):
            tax_text = text
            continue

        # Check for duration indicators
        billing_unit, duration = detect_billing_unit(text)
        if billing_unit != 'one_time':
            duration_text = text
            # If text has more than just duration, might include name
            if len(text) > 20 and is_likely_service_name(text):
                name = text
            continue

        # Otherwise, if it looks like a service name and is on the left side
        if is_likely_service_name(text) and (rel_pos < 0.5 or name is None):
            name = text

    if not name:
        return None

    return {
        'name': name,
        'price_text': price_text,
        'duration_text': duration_text,
        'tax_text': tax_text
    }


def extract_services(pdf_path: str) -> List[Dict]:
    """
    Extract services from PDF using block-level text extraction.
    """
    doc = fitz.open(pdf_path)
    services = []
    seen_names = set()

    for page_num, page in enumerate(doc):
        page_width = page.rect.width

        # Extract all text spans
        spans = extract_text_spans(page)
        if not spans:
            continue

        # Cluster into rows
        rows = cluster_spans_by_y(spans)
        if not rows:
            continue

        # Detect column boundaries
        columns = detect_column_boundaries(rows)

        # Process each row
        for row in rows:
            row_data = extract_row_data(row, columns, page_width)
            if not row_data or not row_data.get('name'):
                continue

            name = row_data['name']

            # Skip duplicates
            normalized_name = name.lower().strip()
            if normalized_name in seen_names:
                continue
            seen_names.add(normalized_name)

            # Parse price
            price_cents = None
            if row_data.get('price_text'):
                price_cents = parse_swiss_price(row_data['price_text'])

            if price_cents is None or price_cents <= 0:
                continue  # Skip entries without valid price

            # Parse billing unit
            full_text = ' '.join([
                row_data.get('name', ''),
                row_data.get('duration_text', '') or ''
            ])
            billing_unit, duration = detect_billing_unit(full_text)

            # Parse tax rate
            tax_rate = None
            if row_data.get('tax_text'):
                tax_rate = parse_tax_rate(row_data['tax_text'])

            # Calculate confidence
            confidence = 0.85
            if len(name) > 60:
                confidence -= 0.1
            if price_cents > 10000000:  # > 100,000 CHF
                confidence -= 0.3
            if tax_rate:
                confidence += 0.05
            if billing_unit != 'one_time':
                confidence += 0.05
            confidence = max(0.1, min(1.0, confidence))

            service = ParsedService(
                name=name,
                price_cents=price_cents,
                billing_unit=billing_unit,
                tax_rate=tax_rate,
                duration_text=row_data.get('duration_text'),
                notes=f"Page {page_num + 1}",
                confidence=confidence
            )
            services.append(asdict(service))

    doc.close()
    return services


def extract_services_fallback(pdf_path: str) -> List[Dict]:
    """
    Fallback extraction using full-page text when structured extraction fails.
    """
    doc = fitz.open(pdf_path)
    services = []
    seen_names = set()

    # Price pattern that captures CHF amounts
    price_pattern = re.compile(
        r'([A-Za-zÀ-ÿ][^CHF€\n]{3,60}?)\s*'  # Service name
        r'(?:CHF|Fr\.|€)?\s*'  # Optional currency
        r"([\d'.,]+(?:[.–—-]|\d{2})?)"  # Price
        r'(?:\s*(?:CHF|Fr\.))?'  # Optional trailing currency
    )

    for page_num, page in enumerate(doc):
        text = page.get_text("text")

        for match in price_pattern.finditer(text):
            name = match.group(1).strip()
            price_str = match.group(2)

            if not is_likely_service_name(name):
                continue

            normalized_name = name.lower().strip()
            if normalized_name in seen_names:
                continue
            seen_names.add(normalized_name)

            price_cents = parse_swiss_price(price_str)
            if price_cents is None or price_cents <= 0:
                continue

            billing_unit, duration = detect_billing_unit(name)

            service = ParsedService(
                name=name,
                price_cents=price_cents,
                billing_unit=billing_unit,
                tax_rate=None,
                duration_text=duration,
                notes=f"Page {page_num + 1} (fallback)",
                confidence=0.6
            )
            services.append(asdict(service))

    doc.close()
    return services


def main():
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No PDF path provided'}))
        sys.exit(1)

    pdf_path = sys.argv[1]

    try:
        # Try structured extraction first
        services = extract_services(pdf_path)

        # If no results, try fallback
        if not services:
            services = extract_services_fallback(pdf_path)

        # Sort by confidence descending
        services.sort(key=lambda s: s['confidence'], reverse=True)

        result = {
            'success': True,
            'services': services,
            'count': len(services),
            'method': 'structured' if services and services[0].get('notes', '').find('fallback') == -1 else 'fallback'
        }
        print(json.dumps(result, ensure_ascii=False))

    except fitz.FileDataError as e:
        print(json.dumps({'success': False, 'error': f'Invalid PDF file: {str(e)}'}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)


if __name__ == '__main__':
    main()
