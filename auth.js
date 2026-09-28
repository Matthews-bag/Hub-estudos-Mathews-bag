// ========================================================
// CONFIGURAÇÃO SUPABASE
// ========================================================
const SUPABASE_URL = 'https://uobdcwzsotcegvzhrkfa.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvYmRjd3pzb3RjZWd2emhya2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NzQ1NzksImV4cCI6MjEwNjE1MDU3OX0.3mv9k4Ynqu-mVyHu28wmkuNOywRcaXrNi0iqDHoQkDA'; 

const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const formLogin = document.getElementById('form-login');
const btnBiometrics = document.getElementById('btn-biometrics');
const authError = document.getElementById('auth-error');

function showError(msg) {
  if (authError) {
    authError.innerText = msg;
    authError.classList.remove('hidden');
  }
}

// 1. Login com E-mail e Senha (Supabase Auth)
if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (authError) authError.classList.add('hidden');

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!db) {
      showError('Erro de conexão com o Supabase. Verifique a SDK.');
      return;
    }

    const { data, error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
      showError('Falha na autenticação: ' + error.message);
    } else {
      window.location.href = 'index.html';
    }
  });
}

// 2. Login com Biometria / Digital (WebAuthn API)
if (btnBiometrics) {
  btnBiometrics.addEventListener('click', async () => {
    if (authError) authError.classList.add('hidden');

    if (!window.PublicKeyCredential) {
      showError('O seu navegador/dispositivo não suporta autenticação biométrica.');
      return;
    }

    try {
      // Dispara o leitor biométrico nativo (Windows Hello / Touch ID / Leitor de Digital do Celular)
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
          timeout: 60000,
          userVerification: "preferred"
        }
      });

      if (credential) {
        window.location.href = 'index.html';
      }
    } catch (err) {
      showError('Leitura biométrica cancelada ou não reconhecida.');
    }
  });
}