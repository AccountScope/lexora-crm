BEGIN;

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    case_id UUID REFERENCES matters(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX activities_created_idx ON activities (created_at DESC);
CREATE INDEX activities_type_idx ON activities (type);
CREATE INDEX activities_user_idx ON activities (user_id);
CREATE INDEX activities_case_idx ON activities (case_id);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    mentions UUID[] NOT NULL DEFAULT ARRAY[]::uuid[],
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    liked_by UUID[] NOT NULL DEFAULT ARRAY[]::uuid[],
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX comments_entity_idx ON comments (entity_type, entity_id, created_at DESC);
CREATE INDEX comments_parent_idx ON comments (parent_id);
CREATE INDEX comments_user_idx ON comments (user_id);
CREATE INDEX comments_mentions_idx ON comments USING GIN (mentions);
CREATE INDEX comments_likes_idx ON comments USING GIN (liked_by);

ALTER TABLE notifications
    ADD COLUMN comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;

COMMIT;
