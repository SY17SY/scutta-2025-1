"""Rename win_rate to rate_count, achievement to achieve_count

Revision ID: 2421efdf8837
Revises: b1ba8eb4ef9d
Create Date: 2025-01-01 21:32:46.032899

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2421efdf8837'
down_revision = 'b1ba8eb4ef9d'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('player', 'win_rate', new_column_name='rate_count')
    op.alter_column('player', 'achievements', new_column_name='achieve_count')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('player', 'rate_count', new_column_name='win_rate')
    op.alter_column('player', 'achieve_count', new_column_name='achievements')

    # ### end Alembic commands ###