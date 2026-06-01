"""fix domain check movie instead of film

Revision ID: 6adc99b8fd61
Revises: 91a4c476188c
Create Date: 2026-06-01 15:06:55.233851

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6adc99b8fd61'
down_revision: Union[str, None] = '91a4c476188c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('ck_nodes_domain', 'nodes', type_='check')
    op.execute("UPDATE nodes SET domain = 'movie' WHERE domain = 'film'")
    op.create_check_constraint(
        'ck_nodes_domain',
        'nodes',
        "domain IN ('movie', 'music', 'book')",
    )


def downgrade() -> None:
    op.drop_constraint('ck_nodes_domain', 'nodes', type_='check')
    op.execute("UPDATE nodes SET domain = 'film' WHERE domain = 'movie'")
    op.create_check_constraint(
        'ck_nodes_domain',
        'nodes',
        "domain IN ('film', 'music', 'book')",
    )
