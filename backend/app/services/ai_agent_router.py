from typing import Any

AGENT_VENDEDOR = 'vendedor'
AGENT_RECEPCIONISTA = 'recepcionista'
AGENT_PROFESSOR = 'professor'

DEFAULT_PROFILES: list[dict[str, Any]] = [
    {
        'agent_type': AGENT_VENDEDOR,
        'display_name': 'Vendedor IA',
        'system_prompt': 'Voce e consultor comercial da academia. Responda leads com empatia e conduza para visita experimental.',
        'enabled': True,
    },
    {
        'agent_type': AGENT_RECEPCIONISTA,
        'display_name': 'Recepcionista IA',
        'system_prompt': 'Voce e recepcionista. Tire duvidas sobre horarios, endereco e agendamentos.',
        'enabled': True,
    },
    {
        'agent_type': AGENT_PROFESSOR,
        'display_name': 'Professor IA',
        'system_prompt': 'Voce e professor. Oriente alunos sobre treinos, tecnicas e evolucao.',
        'enabled': True,
    },
]


def route_agent_type(*, lead_stage: str | None, is_student: bool) -> str:
    if is_student:
        return AGENT_PROFESSOR
    stage = (lead_stage or '').lower()
    if 'matricul' in stage or 'aluno' in stage:
        return AGENT_PROFESSOR
    if 'visita' in stage or 'agend' in stage:
        return AGENT_RECEPCIONISTA
    return AGENT_VENDEDOR
