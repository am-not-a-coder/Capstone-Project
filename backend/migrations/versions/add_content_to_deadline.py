"""
Add content column to deadline table
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_content_to_deadline'
down_revision = 'e84b7af33954'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('deadline', sa.Column('content', sa.Text(), nullable=False, server_default=''))
    op.alter_column('deadline', 'content', server_default=None)

def downgrade():
    op.drop_column('deadline', 'content')
