"""Add winner_rank and loser_rank to Match

Revision ID: fb5fc76bc21a
Revises: c0e5132e51d7
Create Date: 2025-01-01 14:11:34.646818

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fb5fc76bc21a'
down_revision = 'c0e5132e51d7'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('match', schema=None) as batch_op:
        batch_op.add_column(sa.Column('winner_rank', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('loser_rank', sa.Integer(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('match', schema=None) as batch_op:
        batch_op.drop_column('loser_rank')
        batch_op.drop_column('winner_rank')

    # ### end Alembic commands ###