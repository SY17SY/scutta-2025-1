"""Remove and recreate p1-p5 as String

Revision ID: 9715d27d9726
Revises: 7aa4340868fd
Create Date: 2025-01-03 00:38:03.404543

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9715d27d9726'
down_revision = '7aa4340868fd'
branch_labels = None
depends_on = None


def upgrade():
    # Remove existing p1-p5 columns
    with op.batch_alter_table('league', schema=None) as batch_op:
        batch_op.drop_constraint('league_p1_fkey', type_='foreignkey', if_exists=True)
        batch_op.drop_constraint('league_p2_fkey', type_='foreignkey', if_exists=True)
        batch_op.drop_constraint('league_p3_fkey', type_='foreignkey', if_exists=True)
        batch_op.drop_constraint('league_p4_fkey', type_='foreignkey', if_exists=True)
        batch_op.drop_constraint('league_p5_fkey', type_='foreignkey', if_exists=True)
        batch_op.drop_column('p1')
        batch_op.drop_column('p2')
        batch_op.drop_column('p3')
        batch_op.drop_column('p4')
        batch_op.drop_column('p5')

    # Add new p1-p5 columns as String
    with op.batch_alter_table('league', schema=None) as batch_op:
        batch_op.add_column(sa.Column('p1', sa.String(100), nullable=True))
        batch_op.add_column(sa.Column('p2', sa.String(100), nullable=True))
        batch_op.add_column(sa.Column('p3', sa.String(100), nullable=True))
        batch_op.add_column(sa.Column('p4', sa.String(100), nullable=True))
        batch_op.add_column(sa.Column('p5', sa.String(100), nullable=True))


def downgrade():
    # Remove the newly added p1-p5 columns
    with op.batch_alter_table('league', schema=None) as batch_op:
        batch_op.drop_column('p1')
        batch_op.drop_column('p2')
        batch_op.drop_column('p3')
        batch_op.drop_column('p4')
        batch_op.drop_column('p5')

    # Add back original p1-p5 columns as Integer with foreign keys
    with op.batch_alter_table('league', schema=None) as batch_op:
        batch_op.add_column(sa.Column('p1', sa.Integer, nullable=True))
        batch_op.add_column(sa.Column('p2', sa.Integer, nullable=True))
        batch_op.add_column(sa.Column('p3', sa.Integer, nullable=True))
        batch_op.add_column(sa.Column('p4', sa.Integer, nullable=True))
        batch_op.add_column(sa.Column('p5', sa.Integer, nullable=True))
        batch_op.create_foreign_key('league_p1_fkey', 'player', ['p1'], ['id'])
        batch_op.create_foreign_key('league_p2_fkey', 'player', ['p2'], ['id'])
        batch_op.create_foreign_key('league_p3_fkey', 'player', ['p3'], ['id'])
        batch_op.create_foreign_key('league_p4_fkey', 'player', ['p4'], ['id'])
        batch_op.create_foreign_key('league_p5_fkey', 'player', ['p5'], ['id'])
