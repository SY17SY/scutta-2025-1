"""add submitted to Betting

Revision ID: dc0c79ac647c
Revises: 5043020b3c24
Create Date: 2025-01-19 16:27:56.994540

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'dc0c79ac647c'
down_revision = '5043020b3c24'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('betting', schema=None) as batch_op:
        batch_op.add_column(sa.Column('submitted', sa.Boolean(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('betting', schema=None) as batch_op:
        batch_op.drop_column('submitted')

    # ### end Alembic commands ###
