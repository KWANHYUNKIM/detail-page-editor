-- ============================================================
-- Detail Editor: Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles (extends auth.users) ──────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Projects ───────────────────────────────────────────────

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'creator'
    CHECK (mode IN ('creator', 'consumer')),
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  template_id TEXT,
  preset TEXT NOT NULL DEFAULT 'detail-page',
  canvas JSONB NOT NULL DEFAULT '{"width":860,"height":3000,"backgroundColor":"#ffffff"}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  forked_from_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Pages ──────────────────────────────────────────────────

CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '페이지 1',
  sort_order INTEGER NOT NULL DEFAULT 0,
  elements JSONB NOT NULL DEFAULT '[]'::jsonb,
  layers JSONB NOT NULL DEFAULT '[]'::jsonb,
  layer_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────

CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_public ON projects(is_public) WHERE is_public = true;
CREATE INDEX idx_projects_forked_from ON projects(forked_from_id);
CREATE INDEX idx_pages_project ON pages(project_id);
CREATE INDEX idx_pages_sort_order ON pages(project_id, sort_order);

-- ── updated_at Trigger ─────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Auto-create profile on signup ──────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Row Level Security ─────────────────────────────────────

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_own"
  ON projects FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "projects_select_public"
  ON projects FOR SELECT
  USING (is_public = true);

CREATE POLICY "projects_insert_own"
  ON projects FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update_own"
  ON projects FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "projects_delete_own"
  ON projects FOR DELETE
  USING (owner_id = auth.uid());

-- Pages
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pages_select_own_project"
  ON pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pages.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "pages_select_public_project"
  ON pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pages.project_id
      AND projects.is_public = true
    )
  );

CREATE POLICY "pages_insert_own_project"
  ON pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pages.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "pages_update_own_project"
  ON pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pages.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "pages_delete_own_project"
  ON pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pages.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- ── Fork Function ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION fork_project(source_project_id UUID)
RETURNS UUID AS $$
DECLARE
  new_project_id UUID;
  source_project projects%ROWTYPE;
BEGIN
  -- Source must be public
  SELECT * INTO source_project
  FROM projects
  WHERE id = source_project_id AND is_public = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found or not public';
  END IF;

  -- Create forked project (owned by current user)
  INSERT INTO projects (owner_id, name, mode, is_template, preset, canvas, is_public, forked_from_id)
  VALUES (
    auth.uid(),
    source_project.name || ' (복사본)',
    source_project.mode,
    false,
    source_project.preset,
    source_project.canvas,
    false,
    source_project_id
  )
  RETURNING id INTO new_project_id;

  -- Deep-copy all pages (new UUIDs generated by DEFAULT)
  INSERT INTO pages (project_id, name, sort_order, elements, layers, layer_order)
  SELECT new_project_id, name, sort_order, elements, layers, layer_order
  FROM pages
  WHERE project_id = source_project_id
  ORDER BY sort_order;

  RETURN new_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Storage Bucket for Images ──────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "project_images_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-images');

CREATE POLICY "project_images_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "project_images_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
