
import { useState } from 'react'
import puter from '@heyputer/puter.js'
import './Mestre.css'

export default function Mestre() {
  const [mensagem, setMensagem] = useState('')
  const [historico, setHistorico] = useState([
    {
      autor: 'mestre',
      texto: 'Sistema iniciado. Sou o MESTRE, seu mentor de evolução. Qual objetivo vamos conquistar hoje?',
    },
  ])
  const [carregando, setCarregando] = useState(false)

  async function enviarMensagem(e) {
    e.preventDefault()

    const texto = mensagem.trim()
    if (!texto || carregando) return

    const conversa = [...historico, { autor: 'voce', texto }]
    setHistorico(conversa)
    setMensagem('')
    setCarregando(true)

    try {
      const contexto = conversa
        .map((item) =>
          `${item.autor === 'voce' ? 'Jogador' : 'MESTRE'}: ${item.texto}`
        )
        .join('\n')

      const resposta = await puter.ai.chat(
        `Você é o MESTRE, mentor pessoal do aplicativo DOMINE O JOGO.
Ajude o jogador com disciplina, organização, metas e evolução pessoal.
Fale em português brasileiro, com tom motivador, direto e amigável.
Transforme objetivos grandes em ações práticas.
Não invente informações sobre o jogador.
Responda com clareza e sem textos desnecessariamente longos.

Conversa:
${contexto}`
      )

      const textoResposta =
        typeof resposta === 'string'
          ? resposta
          : resposta?.message?.content ?? 'Não consegui gerar uma resposta.'

      setHistorico((atual) => [
        ...atual,
        { autor: 'mestre', texto: String(textoResposta) },
      ])
    } catch (erro) {
      console.error('Erro no MESTRE:', erro)
      setHistorico((atual) => [
        ...atual,
        {
          autor: 'mestre',
          texto: 'Não consegui me conectar à IA. Verifique sua conexão e tente novamente. Se necessário, confira o login do Puter.',
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

      <div className="mestre-mensagens" aria-live="polite">
        {historico.map((item, indice) => (
          <div
            key={indice}
            className={`mestre-balao ${item.autor === 'voce' ? 'jogador' : ''}`}
          >
            <small>{item.autor === 'voce' ? 'VOCÊ' : 'MESTRE'}</small>
            <p>{item.texto}</p>
          </div>
        ))}

        {carregando && (
          <div className="mestre-digitando">MESTRE está pensando...</div>
        )}
      </div>

      <form className="mestre-form" onSubmit={enviarMensagem}>
        <input
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Digite seu objetivo ou sua dúvida..."
          aria-label="Mensagem para o MESTRE"
          disabled={carregando}
        />
        <button type="submit" disabled={carregando || !mensagem.trim()}>
          {carregando ? '...' : 'ENVIAR ↗'}
        </button>
      </form>
    </section>
  )
}
