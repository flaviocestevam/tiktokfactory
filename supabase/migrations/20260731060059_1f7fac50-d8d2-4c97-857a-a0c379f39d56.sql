
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  foto TEXT,
  plano TEXT NOT NULL DEFAULT 'free',
  configuracoes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name'), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  marca TEXT, categoria TEXT, link TEXT, descricao TEXT, beneficios TEXT,
  caracteristicas TEXT, ingredientes TEXT, modo_de_uso TEXT, publico TEXT,
  preco TEXT, preco_promocional TEXT, variacoes TEXT, tamanho TEXT, cores TEXT,
  informacoes_tecnicas TEXT,
  imagens JSONB NOT NULL DEFAULT '[]'::jsonb,
  avaliacoes TEXT, duvidas_frequentes TEXT, advertencias TEXT, restricoes TEXT,
  diferenciais TEXT, entrega TEXT, garantias TEXT, oferta TEXT, dados_adicionais TEXT,
  dados_extraidos JSONB NOT NULL DEFAULT '{}'::jsonb,
  status_extracao TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_own" ON public.products FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  nome_exibicao TEXT, nicho TEXT, idade INTEGER, cidade_natal TEXT, cidade_atual TEXT,
  profissao TEXT, biografia TEXT, historia_pessoal TEXT, personalidade TEXT, missao TEXT,
  valores TEXT, arquetipo TEXT, publico_principal TEXT, tipo_comunicacao TEXT,
  velocidade_fala TEXT, nivel_energia TEXT, estilo_humor TEXT, vocabulario TEXT,
  expressoes_permitidas TEXT, expressoes_proibidas TEXT, bordoes TEXT, estilo_venda TEXT,
  nivel_autoridade TEXT, forma_demonstrar TEXT, tipos_cta TEXT, categorias_permitidas TEXT,
  categorias_proibidas TEXT, aparencia_fisica TEXT, descricao_rosto TEXT, descricao_olhos TEXT,
  descricao_pele TEXT, descricao_cabelo TEXT, descricao_corpo TEXT, altura TEXT,
  estilo_roupas TEXT, acessorios TEXT, maquiagem TEXT, caracteristicas_fixas TEXT,
  caracteristicas_variaveis TEXT, regras_consistencia TEXT, prompt_mestre TEXT,
  prompt_negativo TEXT, foto_canonica_principal TEXT,
  fotos_canonicas_auxiliares JSONB NOT NULL DEFAULT '[]'::jsonb,
  foto_rosto TEXT, foto_tres_quartos TEXT, foto_corpo_inteiro TEXT, foto_expressao TEXT,
  arquivos_referencia JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'rascunho',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.characters TO authenticated;
GRANT ALL ON public.characters TO service_role;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "characters_own" ON public.characters FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_characters_updated BEFORE UPDATE ON public.characters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, descricao TEXT, ambiente TEXT, horario TEXT, iluminacao TEXT,
  enquadramento TEXT, estilo TEXT,
  pessoas_ao_fundo BOOLEAN NOT NULL DEFAULT false,
  objetos TEXT, regras TEXT, imagem_referencia TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scenarios TO authenticated;
GRANT ALL ON public.scenarios TO service_role;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scenarios_own" ON public.scenarios FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_scenarios_updated BEFORE UPDATE ON public.scenarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE SET NULL,
  cenario_texto TEXT,
  plataforma TEXT NOT NULL DEFAULT 'TikTok Shop',
  duracao INTEGER NOT NULL DEFAULT 30,
  formato TEXT NOT NULL DEFAULT '9:16',
  objetivo TEXT, estilo TEXT, tom_linguagem TEXT, nivel_energia TEXT,
  velocidade_fala TEXT, observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_own" ON public.projects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  analise JSONB NOT NULL DEFAULT '{}'::jsonb,
  publico TEXT, problema TEXT,
  beneficios JSONB NOT NULL DEFAULT '[]'::jsonb,
  objecoes JSONB NOT NULL DEFAULT '[]'::jsonb,
  angulos JSONB NOT NULL DEFAULT '[]'::jsonb,
  angulo_escolhido JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.strategies TO authenticated;
GRANT ALL ON public.strategies TO service_role;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "strategies_own" ON public.strategies FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_strategies_updated BEFORE UPDATE ON public.strategies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL DEFAULT 1,
  rotulo TEXT, gancho TEXT, roteiro_completo TEXT,
  cenas JSONB NOT NULL DEFAULT '[]'::jsonb,
  dialogo TEXT, acoes TEXT, movimentos_camera TEXT, textos_tela TEXT,
  cta TEXT, legenda TEXT, hashtags TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scripts TO authenticated;
GRANT ALL ON public.scripts TO service_role;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scripts_own" ON public.scripts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_scripts_updated BEFORE UPDATE ON public.scripts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.image_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL DEFAULT 1,
  prompt TEXT, prompt_negativo TEXT, enquadramento TEXT, pose TEXT,
  iluminacao TEXT, maos_produto TEXT, expressao TEXT, continuidade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_prompts TO authenticated;
GRANT ALL ON public.image_prompts TO service_role;
ALTER TABLE public.image_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "image_prompts_own" ON public.image_prompts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_image_prompts_updated BEFORE UPDATE ON public.image_prompts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.video_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL DEFAULT 1,
  prompt_flow TEXT, descricao_cena TEXT, acoes TEXT, camera TEXT, dialogo TEXT,
  expressao TEXT, produto TEXT, continuidade TEXT, restricoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_prompts TO authenticated;
GRANT ALL ON public.video_prompts TO service_role;
ALTER TABLE public.video_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "video_prompts_own" ON public.video_prompts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_video_prompts_updated BEFORE UPDATE ON public.video_prompts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, categoria TEXT, tipo TEXT, conteudo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_own" ON public.templates FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tipo_conteudo TEXT NOT NULL,
  versao INTEGER NOT NULL DEFAULT 1,
  conteudo_anterior JSONB,
  conteudo_novo JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.version_history TO authenticated;
GRANT ALL ON public.version_history TO service_role;
ALTER TABLE public.version_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "version_history_own" ON public.version_history FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
