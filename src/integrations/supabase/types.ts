export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      characters: {
        Row: {
          acessorios: string | null
          altura: string | null
          aparencia_fisica: string | null
          arquetipo: string | null
          arquivos_referencia: Json
          ativo: boolean
          biografia: string | null
          biografia_interna: string | null
          bordoes: string | null
          caracteristicas_fixas: string | null
          caracteristicas_variaveis: string | null
          categorias_permitidas: string | null
          categorias_prioritarias: string | null
          categorias_proibidas: string | null
          cidade_atual: string | null
          cidade_natal: string | null
          created_at: string
          descricao_cabelo: string | null
          descricao_corpo: string | null
          descricao_olhos: string | null
          descricao_pele: string | null
          descricao_rosto: string | null
          desejos_publico: string | null
          dores_publico: string | null
          estilo_humor: string | null
          estilo_interpretacao: string | null
          estilo_roupas: string | null
          estilo_venda: string | null
          expressoes_permitidas: string | null
          expressoes_proibidas: string | null
          forma_demonstrar: string | null
          formatos_roteiro: string | null
          foto_atualizada_em: string | null
          foto_canonica_path: string | null
          foto_canonica_principal: string | null
          foto_corpo_inteiro: string | null
          foto_expressao: string | null
          foto_rosto: string | null
          foto_tres_quartos: string | null
          fotos_canonicas_auxiliares: Json
          gatilhos_persuasao: string | null
          historia_pessoal: string | null
          id: string
          idade: number | null
          identidade_visual_canonica: string | null
          identidade_visual_confirmada: boolean
          identity_version: string
          maquiagem: string | null
          missao: string | null
          nicho: string | null
          nivel_autoridade: string | null
          nivel_energia: string | null
          nome: string
          nome_exibicao: string | null
          objecoes_comuns: string | null
          palavras_proibidas: string | null
          personalidade: string | null
          pilares_conteudo: string | null
          posicionamento: string | null
          profissao: string | null
          promessa_central: string | null
          prompt_mestre: string | null
          prompt_negativo: string | null
          publico_principal: string | null
          regras_consistencia: string | null
          regras_flow: string | null
          regras_imagem: string | null
          regras_video: string | null
          slug: string | null
          status: string
          tipo_comunicacao: string | null
          tipos_cta: string | null
          updated_at: string
          valores: string | null
          velocidade_fala: string | null
          vocabulario: string | null
        }
        Insert: {
          acessorios?: string | null
          altura?: string | null
          aparencia_fisica?: string | null
          arquetipo?: string | null
          arquivos_referencia?: Json
          ativo?: boolean
          biografia?: string | null
          biografia_interna?: string | null
          bordoes?: string | null
          caracteristicas_fixas?: string | null
          caracteristicas_variaveis?: string | null
          categorias_permitidas?: string | null
          categorias_prioritarias?: string | null
          categorias_proibidas?: string | null
          cidade_atual?: string | null
          cidade_natal?: string | null
          created_at?: string
          descricao_cabelo?: string | null
          descricao_corpo?: string | null
          descricao_olhos?: string | null
          descricao_pele?: string | null
          descricao_rosto?: string | null
          desejos_publico?: string | null
          dores_publico?: string | null
          estilo_humor?: string | null
          estilo_interpretacao?: string | null
          estilo_roupas?: string | null
          estilo_venda?: string | null
          expressoes_permitidas?: string | null
          expressoes_proibidas?: string | null
          forma_demonstrar?: string | null
          formatos_roteiro?: string | null
          foto_atualizada_em?: string | null
          foto_canonica_path?: string | null
          foto_canonica_principal?: string | null
          foto_corpo_inteiro?: string | null
          foto_expressao?: string | null
          foto_rosto?: string | null
          foto_tres_quartos?: string | null
          fotos_canonicas_auxiliares?: Json
          gatilhos_persuasao?: string | null
          historia_pessoal?: string | null
          id?: string
          idade?: number | null
          identidade_visual_canonica?: string | null
          identidade_visual_confirmada?: boolean
          identity_version?: string
          maquiagem?: string | null
          missao?: string | null
          nicho?: string | null
          nivel_autoridade?: string | null
          nivel_energia?: string | null
          nome: string
          nome_exibicao?: string | null
          objecoes_comuns?: string | null
          palavras_proibidas?: string | null
          personalidade?: string | null
          pilares_conteudo?: string | null
          posicionamento?: string | null
          profissao?: string | null
          promessa_central?: string | null
          prompt_mestre?: string | null
          prompt_negativo?: string | null
          publico_principal?: string | null
          regras_consistencia?: string | null
          regras_flow?: string | null
          regras_imagem?: string | null
          regras_video?: string | null
          slug?: string | null
          status?: string
          tipo_comunicacao?: string | null
          tipos_cta?: string | null
          updated_at?: string
          valores?: string | null
          velocidade_fala?: string | null
          vocabulario?: string | null
        }
        Update: {
          acessorios?: string | null
          altura?: string | null
          aparencia_fisica?: string | null
          arquetipo?: string | null
          arquivos_referencia?: Json
          ativo?: boolean
          biografia?: string | null
          biografia_interna?: string | null
          bordoes?: string | null
          caracteristicas_fixas?: string | null
          caracteristicas_variaveis?: string | null
          categorias_permitidas?: string | null
          categorias_prioritarias?: string | null
          categorias_proibidas?: string | null
          cidade_atual?: string | null
          cidade_natal?: string | null
          created_at?: string
          descricao_cabelo?: string | null
          descricao_corpo?: string | null
          descricao_olhos?: string | null
          descricao_pele?: string | null
          descricao_rosto?: string | null
          desejos_publico?: string | null
          dores_publico?: string | null
          estilo_humor?: string | null
          estilo_interpretacao?: string | null
          estilo_roupas?: string | null
          estilo_venda?: string | null
          expressoes_permitidas?: string | null
          expressoes_proibidas?: string | null
          forma_demonstrar?: string | null
          formatos_roteiro?: string | null
          foto_atualizada_em?: string | null
          foto_canonica_path?: string | null
          foto_canonica_principal?: string | null
          foto_corpo_inteiro?: string | null
          foto_expressao?: string | null
          foto_rosto?: string | null
          foto_tres_quartos?: string | null
          fotos_canonicas_auxiliares?: Json
          gatilhos_persuasao?: string | null
          historia_pessoal?: string | null
          id?: string
          idade?: number | null
          identidade_visual_canonica?: string | null
          identidade_visual_confirmada?: boolean
          identity_version?: string
          maquiagem?: string | null
          missao?: string | null
          nicho?: string | null
          nivel_autoridade?: string | null
          nivel_energia?: string | null
          nome?: string
          nome_exibicao?: string | null
          objecoes_comuns?: string | null
          palavras_proibidas?: string | null
          personalidade?: string | null
          pilares_conteudo?: string | null
          posicionamento?: string | null
          profissao?: string | null
          promessa_central?: string | null
          prompt_mestre?: string | null
          prompt_negativo?: string | null
          publico_principal?: string | null
          regras_consistencia?: string | null
          regras_flow?: string | null
          regras_imagem?: string | null
          regras_video?: string | null
          slug?: string | null
          status?: string
          tipo_comunicacao?: string | null
          tipos_cta?: string | null
          updated_at?: string
          valores?: string | null
          velocidade_fala?: string | null
          vocabulario?: string | null
        }
        Relationships: []
      }
      clips: {
        Row: {
          acao: string | null
          camera: string | null
          continuidade: string | null
          created_at: string
          duracao: number
          duracao_estimada: number | null
          duracao_fala: number | null
          estado_final: string | null
          estado_inicial: string | null
          expressao: string | null
          fala: string | null
          gesto: string | null
          id: string
          ligacao_proximo: string | null
          ordem: number
          palavras: number | null
          posicao_produto: string | null
          project_id: string
          prompt_flow: string | null
          prompt_negativo: string | null
          restricoes: string | null
          script_id: string
          updated_at: string
        }
        Insert: {
          acao?: string | null
          camera?: string | null
          continuidade?: string | null
          created_at?: string
          duracao: number
          duracao_estimada?: number | null
          duracao_fala?: number | null
          estado_final?: string | null
          estado_inicial?: string | null
          expressao?: string | null
          fala?: string | null
          gesto?: string | null
          id?: string
          ligacao_proximo?: string | null
          ordem: number
          palavras?: number | null
          posicao_produto?: string | null
          project_id: string
          prompt_flow?: string | null
          prompt_negativo?: string | null
          restricoes?: string | null
          script_id: string
          updated_at?: string
        }
        Update: {
          acao?: string | null
          camera?: string | null
          continuidade?: string | null
          created_at?: string
          duracao?: number
          duracao_estimada?: number | null
          duracao_fala?: number | null
          estado_final?: string | null
          estado_inicial?: string | null
          expressao?: string | null
          fala?: string | null
          gesto?: string | null
          id?: string
          ligacao_proximo?: string | null
          ordem?: number
          palavras?: number | null
          posicao_produto?: string | null
          project_id?: string
          prompt_flow?: string | null
          prompt_negativo?: string | null
          restricoes?: string | null
          script_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clips_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clips_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      image_prompts: {
        Row: {
          continuidade: string | null
          created_at: string
          enquadramento: string | null
          expressao: string | null
          id: string
          iluminacao: string | null
          maos_produto: string | null
          pose: string | null
          project_id: string
          prompt: string | null
          prompt_negativo: string | null
          updated_at: string
          versao: number
        }
        Insert: {
          continuidade?: string | null
          created_at?: string
          enquadramento?: string | null
          expressao?: string | null
          id?: string
          iluminacao?: string | null
          maos_produto?: string | null
          pose?: string | null
          project_id: string
          prompt?: string | null
          prompt_negativo?: string | null
          updated_at?: string
          versao?: number
        }
        Update: {
          continuidade?: string | null
          created_at?: string
          enquadramento?: string | null
          expressao?: string | null
          id?: string
          iluminacao?: string | null
          maos_produto?: string | null
          pose?: string | null
          project_id?: string
          prompt?: string | null
          prompt_negativo?: string | null
          updated_at?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "image_prompts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          advertencias: string | null
          avaliacoes: string | null
          beneficios: string | null
          caracteristicas: string | null
          categoria: string | null
          cores: string | null
          created_at: string
          cupom: string | null
          dados_adicionais: string | null
          dados_extraidos: Json
          desconto: string | null
          descricao: string | null
          descricao_colada: string | null
          diferenciais: string | null
          duvidas_frequentes: string | null
          entrega: string | null
          frete: string | null
          garantias: string | null
          id: string
          imagem_principal: string | null
          imagens: Json
          imagens_enviadas: Json
          informacoes_tecnicas: string | null
          ingredientes: string | null
          last_analyzed_at: string | null
          link: string | null
          marca: string | null
          modo_de_uso: string | null
          nome: string
          numero_avaliacoes: string | null
          oferta: string | null
          origem_dados: Json
          original_tiktok_url: string | null
          preco: string | null
          preco_promocional: string | null
          publico: string | null
          quantidade_vendida: string | null
          resolved_tiktok_url: string | null
          restricoes: string | null
          status_extracao: string
          tamanho: string | null
          tiktok_product_id: string | null
          tiktok_region: string | null
          updated_at: string
          variacoes: string | null
          vendedor: string | null
        }
        Insert: {
          advertencias?: string | null
          avaliacoes?: string | null
          beneficios?: string | null
          caracteristicas?: string | null
          categoria?: string | null
          cores?: string | null
          created_at?: string
          cupom?: string | null
          dados_adicionais?: string | null
          dados_extraidos?: Json
          desconto?: string | null
          descricao?: string | null
          descricao_colada?: string | null
          diferenciais?: string | null
          duvidas_frequentes?: string | null
          entrega?: string | null
          frete?: string | null
          garantias?: string | null
          id?: string
          imagem_principal?: string | null
          imagens?: Json
          imagens_enviadas?: Json
          informacoes_tecnicas?: string | null
          ingredientes?: string | null
          last_analyzed_at?: string | null
          link?: string | null
          marca?: string | null
          modo_de_uso?: string | null
          nome: string
          numero_avaliacoes?: string | null
          oferta?: string | null
          origem_dados?: Json
          original_tiktok_url?: string | null
          preco?: string | null
          preco_promocional?: string | null
          publico?: string | null
          quantidade_vendida?: string | null
          resolved_tiktok_url?: string | null
          restricoes?: string | null
          status_extracao?: string
          tamanho?: string | null
          tiktok_product_id?: string | null
          tiktok_region?: string | null
          updated_at?: string
          variacoes?: string | null
          vendedor?: string | null
        }
        Update: {
          advertencias?: string | null
          avaliacoes?: string | null
          beneficios?: string | null
          caracteristicas?: string | null
          categoria?: string | null
          cores?: string | null
          created_at?: string
          cupom?: string | null
          dados_adicionais?: string | null
          dados_extraidos?: Json
          desconto?: string | null
          descricao?: string | null
          descricao_colada?: string | null
          diferenciais?: string | null
          duvidas_frequentes?: string | null
          entrega?: string | null
          frete?: string | null
          garantias?: string | null
          id?: string
          imagem_principal?: string | null
          imagens?: Json
          imagens_enviadas?: Json
          informacoes_tecnicas?: string | null
          ingredientes?: string | null
          last_analyzed_at?: string | null
          link?: string | null
          marca?: string | null
          modo_de_uso?: string | null
          nome?: string
          numero_avaliacoes?: string | null
          oferta?: string | null
          origem_dados?: Json
          original_tiktok_url?: string | null
          preco?: string | null
          preco_promocional?: string | null
          publico?: string | null
          quantidade_vendida?: string | null
          resolved_tiktok_url?: string | null
          restricoes?: string | null
          status_extracao?: string
          tamanho?: string | null
          tiktok_product_id?: string | null
          tiktok_region?: string | null
          updated_at?: string
          variacoes?: string | null
          vendedor?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          cenario_texto: string | null
          character_id: string | null
          created_at: string
          cta: string | null
          cta_tipo: string | null
          duracao: number
          estilo: string | null
          etapa: number
          formato: string
          id: string
          image_confirmed: boolean
          image_prompt_used: string | null
          imagem_produto_referencia: string | null
          nivel_energia: string | null
          nome: string
          objetivo: string | null
          observacoes: string | null
          plataforma: string
          product_id: string | null
          reference_image_path: string | null
          reference_image_url: string | null
          scenario_id: string | null
          status: string
          tom_linguagem: string | null
          updated_at: string
          velocidade_fala: string | null
        }
        Insert: {
          cenario_texto?: string | null
          character_id?: string | null
          created_at?: string
          cta?: string | null
          cta_tipo?: string | null
          duracao?: number
          estilo?: string | null
          etapa?: number
          formato?: string
          id?: string
          image_confirmed?: boolean
          image_prompt_used?: string | null
          imagem_produto_referencia?: string | null
          nivel_energia?: string | null
          nome: string
          objetivo?: string | null
          observacoes?: string | null
          plataforma?: string
          product_id?: string | null
          reference_image_path?: string | null
          reference_image_url?: string | null
          scenario_id?: string | null
          status?: string
          tom_linguagem?: string | null
          updated_at?: string
          velocidade_fala?: string | null
        }
        Update: {
          cenario_texto?: string | null
          character_id?: string | null
          created_at?: string
          cta?: string | null
          cta_tipo?: string | null
          duracao?: number
          estilo?: string | null
          etapa?: number
          formato?: string
          id?: string
          image_confirmed?: boolean
          image_prompt_used?: string | null
          imagem_produto_referencia?: string | null
          nivel_energia?: string | null
          nome?: string
          objetivo?: string | null
          observacoes?: string | null
          plataforma?: string
          product_id?: string | null
          reference_image_path?: string | null
          reference_image_url?: string | null
          scenario_id?: string | null
          status?: string
          tom_linguagem?: string | null
          updated_at?: string
          velocidade_fala?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          ambiente: string | null
          created_at: string
          descricao: string | null
          enquadramento: string | null
          estilo: string | null
          horario: string | null
          id: string
          iluminacao: string | null
          imagem_referencia: string | null
          nome: string
          objetos: string | null
          pessoas_ao_fundo: boolean
          regras: string | null
          updated_at: string
        }
        Insert: {
          ambiente?: string | null
          created_at?: string
          descricao?: string | null
          enquadramento?: string | null
          estilo?: string | null
          horario?: string | null
          id?: string
          iluminacao?: string | null
          imagem_referencia?: string | null
          nome: string
          objetos?: string | null
          pessoas_ao_fundo?: boolean
          regras?: string | null
          updated_at?: string
        }
        Update: {
          ambiente?: string | null
          created_at?: string
          descricao?: string | null
          enquadramento?: string | null
          estilo?: string | null
          horario?: string | null
          id?: string
          iluminacao?: string | null
          imagem_referencia?: string | null
          nome?: string
          objetos?: string | null
          pessoas_ao_fundo?: boolean
          regras?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scripts: {
        Row: {
          acoes: string | null
          angulo_nome: string | null
          cenas: Json
          created_at: string
          cta: string | null
          dialogo: string | null
          duracao_estimada: number | null
          duracao_fala: number | null
          duracao_total: number | null
          emocao: string | null
          gancho: string | null
          gancho_visual: string | null
          hashtags: string | null
          id: string
          legenda: string | null
          movimentos_camera: string | null
          num_clipes: number | null
          objetivo: string | null
          palavras: number | null
          plano_clipes: Json | null
          project_id: string
          publico: string | null
          roteiro_completo: string | null
          rotulo: string | null
          textos_tela: string | null
          updated_at: string
          variante: number | null
          versao: number
        }
        Insert: {
          acoes?: string | null
          angulo_nome?: string | null
          cenas?: Json
          created_at?: string
          cta?: string | null
          dialogo?: string | null
          duracao_estimada?: number | null
          duracao_fala?: number | null
          duracao_total?: number | null
          emocao?: string | null
          gancho?: string | null
          gancho_visual?: string | null
          hashtags?: string | null
          id?: string
          legenda?: string | null
          movimentos_camera?: string | null
          num_clipes?: number | null
          objetivo?: string | null
          palavras?: number | null
          plano_clipes?: Json | null
          project_id: string
          publico?: string | null
          roteiro_completo?: string | null
          rotulo?: string | null
          textos_tela?: string | null
          updated_at?: string
          variante?: number | null
          versao?: number
        }
        Update: {
          acoes?: string | null
          angulo_nome?: string | null
          cenas?: Json
          created_at?: string
          cta?: string | null
          dialogo?: string | null
          duracao_estimada?: number | null
          duracao_fala?: number | null
          duracao_total?: number | null
          emocao?: string | null
          gancho?: string | null
          gancho_visual?: string | null
          hashtags?: string | null
          id?: string
          legenda?: string | null
          movimentos_camera?: string | null
          num_clipes?: number | null
          objetivo?: string | null
          palavras?: number | null
          plano_clipes?: Json | null
          project_id?: string
          publico?: string | null
          roteiro_completo?: string | null
          rotulo?: string | null
          textos_tela?: string | null
          updated_at?: string
          variante?: number | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "scripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          analise: Json
          angulo_escolhido: Json | null
          angulos: Json
          beneficios: Json
          created_at: string
          id: string
          objecoes: Json
          problema: string | null
          project_id: string
          publico: string | null
          updated_at: string
        }
        Insert: {
          analise?: Json
          angulo_escolhido?: Json | null
          angulos?: Json
          beneficios?: Json
          created_at?: string
          id?: string
          objecoes?: Json
          problema?: string | null
          project_id: string
          publico?: string | null
          updated_at?: string
        }
        Update: {
          analise?: Json
          angulo_escolhido?: Json | null
          angulos?: Json
          beneficios?: Json
          created_at?: string
          id?: string
          objecoes?: Json
          problema?: string | null
          project_id?: string
          publico?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          categoria: string | null
          conteudo: string | null
          created_at: string
          id: string
          nome: string
          tipo: string | null
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          conteudo?: string | null
          created_at?: string
          id?: string
          nome: string
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          conteudo?: string | null
          created_at?: string
          id?: string
          nome?: string
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      version_history: {
        Row: {
          conteudo_anterior: Json | null
          conteudo_novo: Json | null
          created_at: string
          id: string
          project_id: string
          tipo_conteudo: string
          versao: number
        }
        Insert: {
          conteudo_anterior?: Json | null
          conteudo_novo?: Json | null
          created_at?: string
          id?: string
          project_id: string
          tipo_conteudo: string
          versao?: number
        }
        Update: {
          conteudo_anterior?: Json | null
          conteudo_novo?: Json | null
          created_at?: string
          id?: string
          project_id?: string
          tipo_conteudo?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "version_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      video_prompts: {
        Row: {
          acoes: string | null
          camera: string | null
          continuidade: string | null
          created_at: string
          descricao_cena: string | null
          dialogo: string | null
          expressao: string | null
          id: string
          produto: string | null
          project_id: string
          prompt_flow: string | null
          restricoes: string | null
          script_id: string | null
          updated_at: string
          versao: number
        }
        Insert: {
          acoes?: string | null
          camera?: string | null
          continuidade?: string | null
          created_at?: string
          descricao_cena?: string | null
          dialogo?: string | null
          expressao?: string | null
          id?: string
          produto?: string | null
          project_id: string
          prompt_flow?: string | null
          restricoes?: string | null
          script_id?: string | null
          updated_at?: string
          versao?: number
        }
        Update: {
          acoes?: string | null
          camera?: string | null
          continuidade?: string | null
          created_at?: string
          descricao_cena?: string | null
          dialogo?: string | null
          expressao?: string | null
          id?: string
          produto?: string | null
          project_id?: string
          prompt_flow?: string | null
          restricoes?: string | null
          script_id?: string | null
          updated_at?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_prompts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_prompts_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
