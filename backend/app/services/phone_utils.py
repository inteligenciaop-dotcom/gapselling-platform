import re

# Brasil: 55 + DDD(2) + numero(8-9) => 12 ou 13 digitos
BR_PHONE_LEN = {12, 13}
LID_PHONE_PREFIX = "lid:"


def normalize_phone(value: str | None) -> str:
    if not value:
        return ''
    if value.startswith(LID_PHONE_PREFIX):
        return value
    digits = re.sub(r'\D', '', value)
    if digits.startswith('55') and len(digits) in BR_PHONE_LEN:
        return digits
    if len(digits) in {10, 11}:
        return f'55{digits}'
    return digits


def is_lid_phone(value: str | None) -> bool:
    return bool(value and value.startswith(LID_PHONE_PREFIX))


def lid_phone_key(lid_local: str) -> str:
    digits = re.sub(r'\D', '', lid_local)
    return f'{LID_PHONE_PREFIX}{digits}' if digits else ''


def is_valid_whatsapp_phone(value: str | None) -> bool:
    if is_lid_phone(value):
        return False
    digits = normalize_phone(value)
    if not digits:
        return False
    if digits.startswith('55'):
        return len(digits) in BR_PHONE_LEN
    return 10 <= len(digits) <= 15


def format_whatsapp_jid(phone: str | None, whatsapp_jid: str | None = None) -> str | None:
    if whatsapp_jid and '@' in whatsapp_jid:
        suffix = whatsapp_jid.split('@', 1)[1]
        if suffix == 'lid':
            return whatsapp_jid
        local = whatsapp_jid.split('@', 1)[0]
        if is_valid_whatsapp_phone(local):
            if suffix == 's.whatsapp.net':
                return whatsapp_jid
            return f'{normalize_phone(local)}@s.whatsapp.net'
    if is_lid_phone(phone):
        local = phone[len(LID_PHONE_PREFIX):]
        return f'{local}@lid' if local else None
    phone_digits = normalize_phone(phone)
    if is_valid_whatsapp_phone(phone_digits):
        return f'{phone_digits}@s.whatsapp.net'
    return None


def format_contact_label(phone: str | None, contact_name: str | None = None, whatsapp_jid: str | None = None) -> str:
    if contact_name and contact_name.strip():
        return contact_name.strip()
    if is_valid_whatsapp_phone(phone):
        digits = normalize_phone(phone)
        if len(digits) == 13:
            return f'+{digits[:2]} ({digits[2:4]}) {digits[4:9]}-{digits[9:]}'
        if len(digits) == 12:
            return f'+{digits[:2]} ({digits[2:4]}) {digits[4:8]}-{digits[8:]}'
        return digits
    if is_lid_phone(phone):
        return f'WhatsApp ({phone[len(LID_PHONE_PREFIX):][:8]}...)'
    if whatsapp_jid and whatsapp_jid.endswith('@lid'):
        return f'WhatsApp ({whatsapp_jid.split("@")[0][:8]}...)'
    return phone or 'Contato WhatsApp'
