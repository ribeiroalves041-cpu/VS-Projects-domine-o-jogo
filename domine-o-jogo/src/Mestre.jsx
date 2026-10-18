
import { useState, useEffect, useRef } from 'react'
import puter from '@heyputer/puter.js'
import './Mestre.css'

const DAILY_KEY = 'domine-mestre-daily-date'

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function extractText(response) {
  if (typeof response === 'string') return response

  return response?.message?.content
    ?? response?.text
    ?? 'Não consegui gerar uma resposta.'
}

function parseJSON(text) {
  const clean = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')

  if (start === -1 || end === -1) return null

  try {
    return JSON.parse(clean.slice(start, end + 1))
  } catch {
    return null
  }
}

const CHAVE_HISTORICO = 'domine-o-jogo-mestre-historico'

const mensagemInicial = {
  autor: 'mestre',
  texto: 'Sistema iniciado. Sou o MESTRE, seu mentor de evolução. Qual objetivo vamos conquistar hoje?',
}

function carregarHistorico() {
  try {
    const salvo = localStorage.getItem(CHAVE_HISTORICO)
    return salvo ? JSON.parse(salvo) : [mensagemInicial]
  } catch {
    return [mensagemInicial]
  }
}

export default function Mestre({
  tasks = [],
  onCreateMission,
  player = {},
  xp = 0,
}) {
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [historico, setHistorico] = useState(carregarHistorico)

  const mensagensRef = useRef(null)
  const gerandoDiariasRef = useRef(false)

    useEffect(() => {
    localStorage.setItem(
      CHAVE_HISTORICO,
      JSON.stringify(historico)
    )
  }, [historico])

  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop =
        mensagensRef.current.scrollHeight
    }
  }, [historico, carregando])

  async function chamarIA(prompt) {
    const resposta = await puter.ai.chat(prompt)
    return extractText(resposta)
  }

  async function gerarMissoesDiarias() {
    if (!onCreateMission || gerandoDiariasRef.current) return

    const hoje = todayKey()

    try {
      if (localStorage.getItem(DAILY_KEY) === hoje) return
    } catch {
      // Continua mesmo se o navegador bloquear o localStorage.
    }

    gerandoDiariasRef.current = true

    try {
      const prompt = `
Você é o MESTRE do aplicativo DOMINE O JOGO.
Crie exatamente 3 missões diárias curtas, práticas e realistas.
Use português brasileiro.
Considere o objetivo do jogador: ${player.goal || 'evolução pessoal'}.
Considere o codinome: ${player.codename || 'Jogador'}.
Considere o XP atual: ${xp}.
Não proponha tarefas perigosas, gastos obrigatórios ou metas extremas.

Retorne SOMENTE JSON válido neste formato:
{
  "missions": [
    {
      "title": "Título curto da missão",
      "category": "Diária",
      "xp": 10
    }
  ]
}

Regras:
- Exatamente 3 missões.
- Cada título deve ter no máximo 80 caracteres.
- XP deve ser um número entre 10 e 30.
- Não inclua explicações fora do JSON.
`

      const resposta = await chamarIA(prompt)
      const resultado = parseJSON(resposta)

      if (!Array.isArray(resultado?.missions) ||
          resultado.missions.length !== 3) {
        throw new Error('A IA não retornou três missões válidas.')
      }

      resultado.missions.forEach((mission) => {
        if (typeof mission.title !== 'string' || !mission.title.trim()) {
          return
        }

        const xpMission = Number(mission.xp)
        const xpSeguro = Number.isFinite(xpMission)
          ? Math.min(30, Math.max(10, xpMission))
          : 10

        onCreateMission(
          mission.title.trim(),
          'Diária',
          xpSeguro
        )
      })

      try {
        localStorage.setItem(DAILY_KEY, hoje)
      } catch {
        // As missões ainda podem ser criadas nesta sessão.
      }

      setHistorico((atual) => [
        ...atual,
        {
          autor: 'mestre',
          texto: '⚔️ Suas 3 missões diárias foram criadas e adicionadas à central de Missões! Vá até essa página para concluí-las e ganhar XP.',
        },
      ])
    } catch (erro) {
      console.error('Erro ao gerar missões diárias:', erro)

      setHistorico((atual) => [
        ...atual,
        {
          autor: 'mestre',
          texto: 'Não consegui gerar suas missões diárias agora. Verifique sua conexão e o acesso ao Puter e tente novamente mais tarde.',
        },
      ])
    } finally {
      gerandoDiariasRef.current = false
    }
  }

  useEffect(() => {
    gerarMissoesDiarias()
  }, [])

  async function enviarMensagem(e) {
    e.preventDefault()

    const texto = mensagem.trim()
    if (!texto || carregando) return

    const conversa = [
      ...historico,
      { autor: 'voce', texto },
    ]

    setHistorico(conversa)
    setMensagem('')
    setCarregando(true)

    try {
      const contextoMissoes = tasks.map((task) => ({
        titulo: task.title,
        categoria: task.category,
        xp: task.xp,
        concluida: task.done,
      }))

      const prompt = `
Você é o MESTRE, mentor do aplicativo DOMINE O JOGO.
Fale em português brasileiro, com tom motivador, direto e amigável.
Ajude com disciplina, organização, metas e evolução pessoal.
Não invente dados sobre o jogador.

DADOS DO JOGADOR:
Nome: ${player.name || 'Jogador'}
Codinome: ${player.codename || 'Jogador'}
Objetivo: ${player.goal || 'Evolução pessoal'}
XP: ${xp}

MISSÕES CADASTRADAS:
${JSON.stringify(contextoMissoes, null, 2)}

HISTÓRICO DA CONVERSA:
${conversa
  .map((item) =>
    `${item.autor === 'voce' ? 'Jogador' : 'MESTRE'}: ${item.texto}`
  )
  .join('\n')}

Se o jogador pedir para criar, adicionar ou montar missões,
retorne SOMENTE JSON válido neste formato:
{
  "type": "create_missions",
  "text": "Breve mensagem para o jogador",
  "missions": [
    {
      "title": "Título da missão",
      "category": "Pessoal",
      "xp": 10
    }
  ]
}

Cada missão deve ter título curto, categoria e XP entre 10 e 30.
Crie no máximo 5 missões por solicitação.
Use a categoria "Diária" quando o jogador pedir missões diárias.

Para qualquer outro pedido, retorne SOMENTE JSON válido:
{
  "type": "message",
  "text": "Sua resposta ao jogador"
}

Não coloque o JSON dentro de blocos Markdown.
`

      const resposta = await chamarIA(prompt)
      const resultado = parseJSON(resposta)

      if (
        resultado?.type === 'create_missions' &&
        Array.isArray(resultado.missions) &&
        onCreateMission
      ) {
        let criadas = 0

        resultado.missions.slice(0, 5).forEach((mission) => {
          if (
            typeof mission.title !== 'string' ||
            !mission.title.trim()
          ) {
            return
          }

          const categoriasPermitidas = [
            'Pessoal',
            'Estudos',
            'Saúde',
            'Rotina',
            'Diária',
          ]

          const categoria = categoriasPermitidas.includes(mission.category)
            ? mission.category
            : 'Pessoal'

          const valorXP = Number(mission.xp)
          const xpSeguro = Number.isFinite(valorXP)
            ? Math.min(30, Math.max(10, valorXP))
            : 10

          onCreateMission(
            mission.title.trim(),
            categoria,
            xpSeguro
          )

          criadas += 1
        })

        setHistorico((atual) => [
          ...atual,
          {
            autor: 'mestre',
            texto: `${resultado.text || 'Missões preparadas!'}\n\n⚔️ ${criadas} missão(ões) adicionada(s) à sua central de Missões.`,
          },
        ])
      } else if (resultado?.type === 'message' && resultado.text) {
        setHistorico((atual) => [
          ...atual,
          { autor: 'mestre', texto: resultado.text },
        ])
      } else {
        setHistorico((atual) => [
          ...atual,
          { autor: 'mestre', texto: resposta },
        ])
      }
    } catch (erro) {
      console.error('Erro no MESTRE:', erro)

      setHistorico((atual) => [
        ...atual,
        {
          autor: 'mestre',
          texto: 'Não consegui me conectar à IA. Verifique sua conexão e o acesso ao Puter e tente novamente.',
        },
      ])
    } finally {
      setCarregando(false)
    }
  }

  return (
    <section className="mestre">
      <header className="mestre-header">
        <div className="mestre-avatar">M</div>

        <div>
          <h2>MESTRE</h2>
          <p>MENTOR DE EVOLUÇÃO PESSOAL</p>
        </div>

        <span className="mestre-status">● ONLINE</span>
      </header>

      <div
        className="mestre-mensagens"
        aria-live="polite"
        ref={mensagensRef}
      >
        {historico.map((item, indice) => (
          <div
            key={indice}
            className={`mestre-balao ${
              item.autor === 'voce' ? 'jogador' : ''
            }`}
          >
            <small>
              {item.autor === 'voce' ? 'VOCÊ' : 'MESTRE'}
            </small>
            <p>{item.texto}</p>
          </div>
        ))}

        {carregando && (
          <div className="mestre-digitando">
            MESTRE está pensando...
          </div>
        )}
      </div>

      <form className="mestre-form" onSubmit={enviarMensagem}>
        <input
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Peça conselhos ou novas missões..."
          aria-label="Mensagem para o MESTRE"
          disabled={carregando}
        />

        <button
          type="submit"
          disabled={carregando || !mensagem.trim()}
        >
          {carregando ? '...' : 'ENVIAR ↗'}
        </button>
      </form>
    </section>
  )
}
