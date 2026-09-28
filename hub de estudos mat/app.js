// ========================================================
// 1. CONFIGURAÇÃO SUPABASE
// ========================================================
const SUPABASE_URL = 'https://uobdcwzsotcegvzhrkfa.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvYmRjd3pzb3RjZWd2emhya2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NzQ1NzksImV4cCI6MjEwNjE1MDU3OX0.3mv9k4Ynqu-mVyHu28wmkuNOywRcaXrNi0iqDHoQkDA'; 

let db = null;
if (window.supabase && SUPABASE_URL.startsWith('http')) {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

function openTaskModal() { document.getElementById('modal-tarefa')?.classList.remove('hidden'); }
function openMateriaModal() { document.getElementById('modal-materia')?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

// ========================================================
// 2. CARREGAR E RENDERIZAR DADOS
// ========================================================
async function carregarTudo() {
  const statusEl = document.getElementById('status-db');
  
  if (!db) {
    if (statusEl) {
      statusEl.innerText = '● Erro na chave do banco';
      statusEl.className = 'text-xs text-red-400';
    }
    return;
  }

  // Verificação de Sessão Ativa
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  if (statusEl) {
    statusEl.innerText = '● Sincronizado ao Supabase';
    statusEl.className = 'text-xs text-emerald-400 font-semibold';
  }

  // Buscar Matérias e Tarefas
  const { data: materias } = await db.from('materias').select('*').order('created_at', { ascending: false });
  const { data: tarefas } = await db.from('tarefas').select('*, materias(nome)').order('created_at', { ascending: false });

  if (materias) renderMaterias(materias);
  if (tarefas) renderTarefas(tarefas);

  // Atualizar Indicadores
  if (materias) document.getElementById('stat-materias').innerText = materias.length;
  if (tarefas) {
    const pendentes = tarefas.filter(t => t.status === 'pendente').length;
    document.getElementById('stat-pendentes').innerText = pendentes;
  }
}

function renderMaterias(materias) {
  const selectModal = document.getElementById('task-materia');
  if (selectModal) selectModal.innerHTML = '<option value="">Sem matéria vinculada</option>';

  const containerWyden = document.getElementById('lista-materias-wyden');
  const containerExtra = document.getElementById('lista-materias-extra');
  
  if (containerWyden) containerWyden.innerHTML = '';
  if (containerExtra) containerExtra.innerHTML = '';

  if (materias.length === 0) {
    if (containerWyden) containerWyden.innerHTML = `<p class="text-slate-500 text-xs col-span-full">Nenhuma disciplina cadastrada.</p>`;
  }

  materias.forEach(m => {
    if (selectModal) selectModal.innerHTML += `<option value="${m.id}">${m.nome}</option>`;

    const htmlCard = `
      <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 hover:border-slate-700 transition">
        <div class="flex justify-between items-start">
          <div>
            <span class="bg-amber-500/10 text-amber-500 text-[10px] px-2.5 py-1 rounded-lg border border-amber-500/20 font-bold uppercase tracking-wider">${m.categoria}</span>
            <h3 class="text-base font-bold mt-2 text-white">${m.nome}</h3>
          </div>
          <button onclick="deletarMateria('${m.id}')" class="text-slate-600 hover:text-red-400 p-1 transition" title="Excluir Matéria">
            <i class="fa-solid fa-trash-can text-sm"></i>
          </button>
        </div>

        <div>
          <div class="flex justify-between text-xs font-semibold mb-1">
            <span class="text-slate-400">Progresso</span>
            <span class="text-amber-500 cursor-pointer" onclick="atualizarProgressoMateria('${m.id}', ${m.progresso || 0})">${m.progresso || 0}% <i class="fa-solid fa-pen text-[10px] ml-1"></i></span>
          </div>
          <div class="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div class="bg-amber-500 h-full transition-all duration-300" style="width: ${m.progresso || 0}%"></div>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-800/80 flex justify-between items-center text-xs">
          <span class="text-slate-500 text-[11px]">Resumos & IA</span>
          <a href="https://notebooklm.google.com" target="_blank" class="bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded-xl text-slate-300 transition border border-slate-800 flex items-center gap-1.5 font-medium">
            <i class="fa-solid fa-brain text-purple-400"></i> NotebookLM
          </a>
        </div>
      </div>
    `;

    if (m.categoria === 'faculdade' && containerWyden) {
      containerWyden.innerHTML += htmlCard;
    } else if (containerExtra) {
      containerExtra.innerHTML += htmlCard;
    }
  });
}

function renderTarefas(tarefas) {
  const container = document.getElementById('lista-tarefas');
  if (!container) return;

  if (tarefas.length === 0) {
    container.innerHTML = `<p class="text-slate-500 text-xs">Nenhuma tarefa criada ainda.</p>`;
    return;
  }

  container.innerHTML = tarefas.map(t => `
    <div class="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl hover:border-slate-700 transition">
      <div class="flex items-center gap-3">
        <input type="checkbox" ${t.status === 'concluido' ? 'checked' : ''} onchange="toggleTask('${t.id}', '${t.status}')" class="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer">
        <div>
          <p class="text-sm font-semibold ${t.status === 'concluido' ? 'line-through text-slate-500' : 'text-slate-200'}">${t.titulo}</p>
          <p class="text-[11px] text-slate-500">${t.materias?.nome || 'Geral'}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider ${t.prioridade === 'alta' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-800 text-slate-400'}">${t.prioridade}</span>
        <button onclick="deletarTarefa('${t.id}')" class="text-slate-600 hover:text-red-400 transition" title="Excluir Task">
          <i class="fa-solid fa-trash-can text-sm"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// ========================================================
// 3. AÇÕES CRUD (INSERIR, EDITAR, DELETAR)
// ========================================================
async function salvarNovaTarefa(e) {
  e.preventDefault();
  const titulo = document.getElementById('task-titulo').value;
  const materia_id = document.getElementById('task-materia').value || null;
  const prioridade = document.getElementById('task-prioridade').value;

  if (!titulo) return;

  const { error } = await db.from('tarefas').insert([{ titulo, materia_id, prioridade, status: 'pendente' }]);
  if (!error) {
    document.getElementById('task-titulo').value = '';
    closeModal('modal-tarefa');
    carregarTudo();
  }
}

async function salvarNovaMateria(e) {
  e.preventDefault();
  const nome = document.getElementById('mat-nome').value;
  const categoria = document.getElementById('mat-categoria').value;

  if (!nome) return;

  const { error } = await db.from('materias').insert([{ nome, categoria, progresso: 0 }]);
  if (!error) {
    document.getElementById('mat-nome').value = '';
    closeModal('modal-materia');
    carregarTudo();
  }
}

async function toggleTask(id, status) {
  const novoStatus = status === 'concluido' ? 'pendente' : 'concluido';
  await db.from('tarefas').update({ status: novoStatus }).eq('id', id);
  carregarTudo();
}

async function atualizarProgressoMateria(id, progressoAtual) {
  const novoProgresso = prompt('Digite o novo progresso da matéria (0 a 100):', progressoAtual);
  if (novoProgresso !== null && !isNaN(novoProgresso)) {
    const valor = Math.min(100, Math.max(0, parseInt(novoProgresso)));
    await db.from('materias').update({ progresso: valor }).eq('id', id);
    carregarTudo();
  }
}

async function deletarMateria(id) {
  if (confirm('Tem certeza que deseja excluir esta matéria?')) {
    await db.from('materias').delete().eq('id', id);
    carregarTudo();
  }
}

async function deletarTarefa(id) {
  await db.from('tarefas').delete().eq('id', id);
  carregarTudo();
}

async function fazerLogout() {
  if (db) {
    await db.auth.signOut();
    window.location.href = 'login.html';
  }
}

document.addEventListener('DOMContentLoaded', carregarTudo);