
import { useEffect, useState } from 'react'
import './App.css'
import Mestre from './Mestre'

const STORAGE_KEY = 'domine-o-jogo-v1'

const menu = [
  { id: 'dashboard', icon: '⌂', label: 'Dashboard' },
  { id: 'missoes', icon: '✳', label: 'Missões' },
  { id: 'rotina', icon: '◷', label: 'Rotina' },
  { id: 'financas', icon: '◇', label: 'Finanças' },
  { id: 'treinos', icon: '△', label: 'Treinos' },
  {id: 'recompensas',label: 'Recompensas',icon: '🎁',},
  { id: 'mestre', icon: '✧', label: 'MESTRE' },
]

const initialData = {
  profile: null,
  xp: 0,
  tasks: [],
  transactions: [],
  workouts: [],
}

const REWARDS = [
  {
    id: 'break',
    title: 'Pausa merecida',
    description: '30 minutos para relaxar.',
    cost: 30,
    icon: '☕',
  },
  {
    id: 'movie',
    title: 'Noite de filme',
    description: 'Uma sessão de filme ou série.',
    cost: 60,
    icon: '🎬',
  },
  {
    id: 'hobby',
    title: 'Tempo para seu hobby',
    description: 'Uma hora para fazer algo que você gosta.',
    cost: 90,
    icon: '🎮',
  },
  {
    id: 'special',
    title: 'Recompensa especial',
    description: 'Escolha um prêmio pessoal.',
    cost: 150,
    icon: '🎁',
  },
]

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...initialData, ...JSON.parse(saved) } : initialData
  } catch {
    return initialData
  }
}

function getLevel(xp) {
  return Math.floor(Math.max(0, xp) / 100) + 1
}

function getLevelProgress(xp) {
  return Math.max(0, xp) % 100
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function App() {
  function buyReward(reward) {
  if (data.coins < reward.cost) {
    setNotice('Moedas insuficientes! Continue cumprindo missões.')
    return
  }

  const confirmed = window.confirm(
    `Comprar "${reward.title}" por ${reward.cost} moedas?`
  )

  if (!confirmed) return

  updateData((current) => ({
    ...current,
    coins: current.coins - reward.cost,
    rewardPurchases: [
      {
        id: crypto.randomUUID(),
        title: reward.title,
        cost: reward.cost,
        date: new Date().toLocaleDateString('pt-BR'),
      },
      ...(current.rewardPurchases || []),
    ],
  }))

  setNotice(`Compra realizada: ${reward.title}!`)
}

  const [data, setData] = useState(loadData)
  const [page, setPage] = useState('dashboard')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  function updateData(updater) {
    setData((current) =>
      typeof updater === 'function' ? updater(current) : updater
    )
  }

  function addXP(amount) {
    updateData((current) => ({ ...current, xp: current.xp + amount }))
  }

  function register(profile) {
    updateData((current) => ({ ...current, profile }))
    setPage('dashboard')
  }

  function completeTask(id) {
    const task = data.tasks.find((item) => item.id === id)
    if (!task || task.done) return

    updateData((current) => ({
      ...current,
      xp: current.xp + task.xp,
      tasks: current.tasks.map((item) =>
        item.id === id ? { ...item, done: true } : item
      ),
    }))
  }

  function addTask(title, category = 'Pessoal', xp = 10) {
    if (!title.trim()) return

    updateData((current) => ({
      ...current,
      tasks: [
        ...current.tasks,
        {
          id: crypto.randomUUID(),
          title: title.trim(),
          category,
          xp,
          done: false,
        },
      ],
    }))
  }

  function addTransaction(type, description, amount) {
    if (!description.trim() || !(Number(amount) > 0)) return

    updateData((current) => ({
      ...current,
      transactions: [
        {
          id: crypto.randomUUID(),
          type,
          description: description.trim(),
          amount: Number(amount),
          date: new Date().toLocaleDateString('pt-BR'),
        },
        ...current.transactions,
      ],
    }))
  }

  function addWorkout(title, duration) {
    if (!title.trim()) return

    updateData((current) => ({
      ...current,
      xp: current.xp + 20,
      workouts: [
        {
          id: crypto.randomUUID(),
          title: title.trim(),
          duration: Number(duration) || 0,
          date: new Date().toLocaleDateString('pt-BR'),
        },
        ...current.workouts,
      ],
    }))
  }

  function resetProgress() {
    if (window.confirm('Deseja apagar todo o progresso salvo neste navegador?')) {
      localStorage.removeItem(STORAGE_KEY)
      setData(initialData)
      setPage('dashboard')
    }
  }

  const level = getLevel(data.xp)
  const income = data.transactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0)
  const expenses = data.transactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0)

  if (!data.profile) {
    return <Registration onRegister={register} />
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">◆</span>
          <span>DOMINE<span className="green">.EXE</span></span>
        </div>

        <div className="player-mini">
          <div className="avatar">{data.profile.codename.slice(0, 1).toUpperCase()}</div>
          <div className="player-mini-info">
            <strong>{data.profile.codename}</strong>
            <span>JOGADOR NÍVEL {level}</span>
          </div>
        </div>

        <span className="nav-caption">MENU PRINCIPAL</span>
        <nav className="nav-menu">
          {menu.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {page === item.id && <span className="active-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status"><span /> SISTEMA ONLINE</div>
          <button className="reset-button" onClick={resetProgress}>
            Reiniciar progresso
          </button>
          <small>BUILD 002.0 · DOMINE O JOGO</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">SISTEMA DE EVOLUÇÃO PESSOAL</span>
            <h1>{menu.find((item) => item.id === page)?.label || 'Dashboard'}</h1>
          </div>
          <div className="topbar-player">
            <span className="online-dot" />
            <span>{data.profile.name}</span>
          </div>
        </header>

        {notice && (
          <div className="notice">
            {notice}
            <button onClick={() => setNotice('')}>×</button>
          </div>
        )}

        {page === 'dashboard' && (
          <Dashboard
            data={data}
            level={level}
            income={income}
            expenses={expenses}
            onNavigate={setPage}
          />
        )}

        {page === 'missoes' && (
          <Missions
            tasks={data.tasks}
            onAdd={addTask}
            onComplete={completeTask}
          />
        )}

        {page === 'rotina' && (
          <Routine
            tasks={data.tasks}
            onAdd={addTask}
            onComplete={completeTask}
          />
        )}

        {page === 'financas' && (
          <Finances
            transactions={data.transactions}
            income={income}
            expenses={expenses}
            onAdd={addTransaction}
          />
        )}

        {page === 'treinos' && (
          <><Workouts workouts={data.workouts} onAdd={addWorkout} /><div className="page-body"></div></>
      )}  

      {page === 'recompensas' && (
  <section className="page-body">
    <div className="section-heading">
      <div>
        <span className="eyebrow">MERCADO DO JOGADOR</span>
        <h2>Loja de recompensas</h2>
        <p>Troque suas moedas pelas recompensas que conquistou.</p>
      </div>
    </div>

    <div className="reward-wallet panel">
      <span className="rpg-icon">◈</span>
      <div>
        <span className="eyebrow">SEU SALDO</span>
        <h2>{data.coins || 0} moedas</h2>
      </div>
    </div>

    <div className="reward-grid">
      {REWARDS.map((reward) => {
        const canBuy = (data.coins || 0) >= reward.cost

        return (
          <article className="reward-card" key={reward.id}>
            <div className="reward-icon">{reward.icon}</div>

            <h3>{reward.title}</h3>
            <p>{reward.description}</p>

            <strong className="reward-cost">
              ◈ {reward.cost} moedas
            </strong>

            <button
              className="primary-button"
              disabled={!canBuy}
              onClick={() => buyReward(reward)}
            >
              {canBuy ? 'Comprar recompensa' : 'Moedas insuficientes'}
            </button>
          </article>
        )
      })}
    </div>

    <div className="panel">
      <h2>Histórico de compras</h2>

      {(data.rewardPurchases || []).length === 0 ? (
        <p>Você ainda não comprou nenhuma recompensa.</p>
      ) : (
        (data.rewardPurchases || []).map((purchase) => (
          <div className="reward-history-row" key={purchase.id}>
            <span>{purchase.title}</span>
            <span>−{purchase.cost} moedas</span>
            <small>{purchase.date}</small>
          </div>
        ))
      )}
    </div>
  </section>
)}

      {page === 'mestre' && (
  <div className="page-body">
    <section className="page-intro">
      <p className="eyebrow">INTELIGÊNCIA ARTIFICIAL</p>
      <h2>Seu mentor pessoal</h2>
      <p>Defina seus objetivos. Planeje suas missões. Evolua.</p>
    </section>

    <Mestre
  tasks={data.tasks}
  onCreateMission={addTask}
  player={data.profile}
  xp={data.xp}
/>
  </div>
)}

            <footer className="main-footer">
              <span>SEU ÚNICO LIMITE É VOCÊ.</span>
              <span>DADOS SALVOS NESTE NAVEGADOR</span>
            </footer>
          </main>
          </div>
        )
}

        function Registration({onRegister}) {
  const [name, setName] = useState('')
        const [codename, setCodename] = useState('')
        const [goal, setGoal] = useState('disciplina')

        function submit(event) {
          event.preventDefault()
    if (!name.trim() || !codename.trim()) return
        onRegister({name: name.trim(), codename: codename.trim(), goal })
  }

        return (
        <main className="registration-screen">
          <div className="registration-grid" />
          <div className="registration-content">
            <div className="brand registration-brand">
              <span className="brand-mark">◆</span>
              DOMINE<span className="green">.EXE</span>
            </div>
            <p className="eyebrow">[ PROTOCOLO DE INICIALIZAÇÃO ]</p>
            <h1>SEU JOGO.<br /><span>SUA EVOLUÇÃO.</span></h1>
            <p className="registration-description">
              Crie seu perfil de jogador e comece a construir uma versão mais forte
              de si mesmo.
            </p>

            <form className="registration-form" onSubmit={submit}>
              <label>
                NOME DO JOGADOR
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Como podemos te chamar?"
                  maxLength={60}
                  required
                />
              </label>

              <label>
                CODINOME
                <input
                  value={codename}
                  onChange={(event) => setCodename(event.target.value)}
                  placeholder="Seu nome de jogador"
                  maxLength={30}
                  required
                />
              </label>

              <label>
                OBJETIVO PRINCIPAL
                <select value={goal} onChange={(event) => setGoal(event.target.value)}>
                  <option value="disciplina">Construir disciplina</option>
                  <option value="financas">Dominar minhas finanças</option>
                  <option value="fitness">Melhorar meu condicionamento</option>
                  <option value="estudos">Aprender e estudar</option>
                  <option value="equilibrio">Equilibrar minha vida</option>
                </select>
              </label>

              <button className="primary-button" type="submit">
                CRIAR MEU PERFIL <span>→</span>
              </button>
            </form>
            <p className="privacy-note">◆ SEU PROGRESSO FICA SALVO NESTE NAVEGADOR</p>
          </div>
        </main>
        )
}

        function Dashboard({data, level, income, expenses, onNavigate}) {
  const progress = getLevelProgress(data.xp)
  const completed = data.tasks.filter((task) => task.done).length
        const recentTasks = [...data.tasks].slice(-4).reverse()

        return (
        <div className="page-body">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">BEM-VINDO DE VOLTA, JOGADOR</p>
              <h2>Olá, {data.profile.codename} <span className="green">↗</span></h2>
              <p>Pequenas ações. Grandes mudanças. Vamos evoluir hoje.</p>
            </div>
            <div className="level-badge">
              <span>NÍVEL</span>
              <strong>{String(level).padStart(2, '0')}</strong>
              <small>JOGADOR</small>
            </div>
          </section>

          <section className="stats-grid">
            <StatCard label="EXPERIÊNCIA TOTAL" value={`${data.xp} XP`} icon="✳" detail="XP conquistado" />
            <StatCard label="MISSÕES CONCLUÍDAS" value={completed} icon="✓" detail="Tarefas finalizadas" />
            <StatCard label="TREINOS REGISTRADOS" value={data.workouts.length} icon="△" detail="Sessões realizadas" />
            <StatCard label="SALDO FINANCEIRO" value={formatMoney(income - expenses)} icon="◇" detail="Receitas menos despesas" />
          </section>

          <section className="panel level-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">PROGRESSO DO JOGADOR</span>
                <h3>Próximo nível</h3>
              </div>
              <span className="xp-label">{progress}/100 XP</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-footer">
              <span>NÍVEL {level}</span>
              <span>FALTAM {100 - progress} XP</span>
              <span>NÍVEL {level + 1}</span>
            </div>
          </section>

          <section className="dashboard-columns">
            <div className="panel">
              <div className="panel-heading">
                <div><span className="eyebrow">SEU OBJETIVO</span><h3>Missões recentes</h3></div>
                <button className="text-button" onClick={() => onNavigate('missoes')}>Ver todas →</button>
              </div>
              {recentTasks.length ? (
                <div className="task-list">
                  {recentTasks.map((task) => (
                    <div className="task-row" key={task.id}>
                      <span className={`task-check ${task.done ? 'checked' : ''}`}>{task.done ? '✓' : '○'}</span>
                      <div className="task-info"><strong>{task.title}</strong><small>{task.category}</small></div>
                      <span className="task-xp">+{task.xp} XP</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="Nenhuma missão ainda. Crie sua primeira missão e comece a ganhar XP." />
              )}
              <button className="secondary-button full-button" onClick={() => onNavigate('missoes')}>+ NOVA MISSÃO</button>
            </div>

            <div className="panel quick-panel">
              <div className="panel-heading">
                <div><span className="eyebrow">AÇÃO RÁPIDA</span><h3>Continue evoluindo</h3></div>
              </div>
              <QuickAction icon="✳" title="Criar missão" description="Conclua tarefas e ganhe XP." onClick={() => onNavigate('missoes')} />
              <QuickAction icon="◷" title="Organizar rotina" description="Planeje seus próximos passos." onClick={() => onNavigate('rotina')} />
              <QuickAction icon="△" title="Registrar treino" description="Cada sessão conta." onClick={() => onNavigate('treinos')} />
              <QuickAction icon="◇" title="Controlar finanças" description="Saiba para onde vai seu dinheiro." onClick={() => onNavigate('financas')} />
            </div>
          </section>
        </div>
        )
}

        function StatCard({label, value, icon, detail}) {
  return (
        <article className="stat-card">
          <div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div>
          <strong className="stat-value">{value}</strong>
          <small>{detail}</small>
        </article>
        )
}

        function QuickAction({icon, title, description, onClick}) {
  return (
        <button className="quick-action" onClick={onClick}>
          <span className="quick-icon">{icon}</span>
          <span className="quick-copy"><strong>{title}</strong><small>{description}</small></span>
          <span className="quick-arrow">→</span>
        </button>
        )
}

        function EmptyState({text}) {
  return <div className="empty-state"><span>◇</span><p>{text}</p></div>
}

        function Missions({tasks, onAdd, onComplete}) {
  return (
        <TaskPage
          title="Central de missões"
          description="Transforme seus objetivos em ações. Cada missão concluída gera experiência."
          tasks={tasks.filter((task) => task.category !== 'Rotina')}
          category="Missão"
          xp={25}
          onAdd={onAdd}
          onComplete={onComplete}
        />
        )
}

        function Routine({tasks, onAdd, onComplete}) {
  return (
        <TaskPage
          title="Rotina diária"
          description="Crie consistência com pequenas tarefas e avance um dia de cada vez."
          tasks={tasks.filter((task) => task.category === 'Rotina')}
          category="Rotina"
          xp={10}
          onAdd={onAdd}
          onComplete={onComplete}
        />
        )
}

        function TaskPage({title, description, tasks, category, xp, onAdd, onComplete}) {
  const [text, setText] = useState('')

        function submit(event) {
          event.preventDefault()
    if (!text.trim()) return
        onAdd(text, category, xp)
        setText('')
  }

        return (
        <div className="page-body">
          <section className="page-intro"><p className="eyebrow">PROTOCOLO DE PRODUTIVIDADE</p><h2>{title}</h2><p>{description}</p></section>
          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow">NOVA TAREFA</span><h3>Adicionar objetivo</h3></div><span className="task-xp">+{xp} XP</span></div>
            <form className="inline-form" onSubmit={submit}>
              <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Ex.: Ler por 20 minutos" maxLength={100} required />
              <button className="primary-button" type="submit">ADICIONAR +</button>
            </form>
          </section>
          <section className="panel task-page-panel">
            <div className="panel-heading"><div><span className="eyebrow">LISTA DE OBJETIVOS</span><h3>Suas tarefas</h3></div><span className="muted">{tasks.filter((task) => task.done).length}/{tasks.length} concluídas</span></div>
            {tasks.length ? (
              <div className="task-list">
                {tasks.map((task) => (
                  <div className={`task-row ${task.done ? 'task-done' : ''}`} key={task.id}>
                    <button className={`task-check ${task.done ? 'checked' : ''}`} disabled={task.done} onClick={() => onComplete(task.id)}>{task.done ? '✓' : '○'}</button>
                    <div className="task-info"><strong>{task.title}</strong><small>{task.category}</small></div>
                    <span className="task-xp">+{task.xp} XP</span>
                    {!task.done && <button className="complete-button" onClick={() => onComplete(task.id)}>Concluir</button>}
                  </div>
                ))}
              </div>
            ) : <EmptyState text="Sua lista está vazia. Adicione uma tarefa acima para começar." />}
          </section>
          <p className="info-note">As tarefas são salvas neste navegador. Concluir uma tarefa concede XP apenas uma vez.</p>
        </div>
        )
}

        function Finances({transactions, income, expenses, onAdd}) {
  const [type, setType] = useState('expense')
        const [description, setDescription] = useState('')
        const [amount, setAmount] = useState('')

        function submit(event) {
          event.preventDefault()
    if (!description.trim() || !(Number(amount) > 0)) return
        onAdd(type, description, amount)
        setDescription('')
        setAmount('')
  }

        return (
        <div className="page-body">
          <section className="page-intro"><p className="eyebrow">CONTROLE DE RECURSOS</p><h2>Suas finanças</h2><p>Registre entradas e saídas para acompanhar seu saldo.</p></section>
          <section className="stats-grid finance-stats">
            <StatCard label="RECEITAS" value={formatMoney(income)} icon="↗" detail="Total registrado" />
            <StatCard label="DESPESAS" value={formatMoney(expenses)} icon="↘" detail="Total registrado" />
            <StatCard label="SALDO" value={formatMoney(income - expenses)} icon="◇" detail="Resultado atual" />
          </section>
          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow">NOVO LANÇAMENTO</span><h3>Registrar movimentação</h3></div></div>
            <form className="transaction-form" onSubmit={submit}>
              <label>TIPO
                <select value={type} onChange={(event) => setType(event.target.value)}>
                  <option value="expense">Despesa</option><option value="income">Receita</option>
                </select>
              </label>
              <label>DESCRIÇÃO
                <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex.: Mercado" maxLength={100} required />
              </label>
              <label>VALOR (R$)
                <input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" required />
              </label>
              <button className="primary-button" type="submit">REGISTRAR</button>
            </form>
          </section>
          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow">HISTÓRICO</span><h3>Movimentações</h3></div></div>
            {transactions.length ? <div className="task-list">
              {transactions.map((item) => (
                <div className="task-row" key={item.id}>
                  <span className={`transaction-icon ${item.type}`}>{item.type === 'income' ? '↗' : '↘'}</span>
                  <div className="task-info"><strong>{item.description}</strong><small>{item.date} · {item.type === 'income' ? 'Receita' : 'Despesa'}</small></div>
                  <strong className={item.type === 'income' ? 'green' : 'expense-value'}>{item.type === 'income' ? '+' : '−'}{formatMoney(item.amount)}</strong>
                </div>
              ))}
            </div> : <EmptyState text="Nenhuma movimentação registrada." />}
          </section>
          <p className="info-note">Este é um controle básico local, não uma conexão com sua conta bancária.</p>
        </div>
        )
}

        function Workouts({workouts, onAdd}) {
  const [title, setTitle] = useState('')
        const [duration, setDuration] = useState('30')

        function submit(event) {
          event.preventDefault()
    if (!title.trim()) return
        onAdd(title, duration)
        setTitle('')
  }

        return (
        <div className="page-body">
          <section className="page-intro"><p className="eyebrow">DESENVOLVIMENTO FÍSICO</p><h2>Treinos</h2><p>Registre suas sessões e ganhe 20 XP por treino cadastrado.</p></section>
          <section className="stats-grid">
            <StatCard label="TREINOS REGISTRADOS" value={workouts.length} icon="△" detail="Sessões realizadas" />
            <StatCard label="TEMPO DE TREINO" value={`${workouts.reduce((sum, item) => sum + item.duration, 0)} min`} icon="◷" detail="Duração total registrada" />
          </section>
          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow">NOVA SESSÃO</span><h3>Registrar treino</h3></div><span className="task-xp">+20 XP</span></div>
            <form className="inline-form workout-form" onSubmit={submit}>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Treino de corpo inteiro" maxLength={100} required />
              <input type="number" min="1" max="600" value={duration} onChange={(event) => setDuration(event.target.value)} aria-label="Duração em minutos" required />
              <button className="primary-button" type="submit">REGISTRAR</button>
            </form>
          </section>
          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow">HISTÓRICO</span><h3>Suas sessões</h3></div></div>
            {workouts.length ? <div className="task-list">
              {workouts.map((workout) => (
                <div className="task-row" key={workout.id}>
                  <span className="quick-icon">△</span>
                  <div className="task-info"><strong>{workout.title}</strong><small>{workout.date}</small></div>
                  <span className="muted">{workout.duration} min</span>
                  <span className="task-xp">+20 XP</span>
                </div>
              ))}
            </div> : <EmptyState text="Nenhum treino registrado. Sua próxima sessão começa aqui." />}
          </section>
          <p className="info-note">Cada registro de treino concede 20 XP. Cadastre apenas sessões que você realmente realizou.</p>
        </div>
        )
}

        export default App
