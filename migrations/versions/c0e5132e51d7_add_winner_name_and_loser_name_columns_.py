"""Add winner_name and loser_name columns to Match

Revision ID: c0e5132e51d7
Revises: 
Create Date: 2024-12-31 17:36:28.305010

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c0e5132e51d7'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('match', schema=None) as batch_op:
        batch_op.add_column(sa.Column('winner_name', sa.String(length=100), nullable=False))
        batch_op.add_column(sa.Column('loser_name', sa.String(length=100), nullable=False))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('match', schema=None) as batch_op:
        batch_op.drop_column('loser_name')
        batch_op.drop_column('winner_name')

    # ### end Alembic commands ###