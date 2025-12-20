const Auth=(()=>{
const KEY="auth",EMAIL="admin@burger.com",PASS="123456";
const logged=()=>localStorage.getItem(KEY)==="true";

function login(e,p){
 if(e===EMAIL&&p===PASS){
  localStorage.setItem(KEY,"true");return true;
 } return false;
}
function logout(){localStorage.removeItem(KEY);location="index.html"}
function requireAuth(){if(!logged())location="index.html"}
function redirectIfLoggedIn(){if(logged())location="admin.html"}

document.addEventListener("submit",e=>{
 if(e.target.id!=="loginForm")return;
 e.preventDefault();
 if(login(email.value,password.value))location="admin.html";
 else alert("Login inválido");
});

return{logout,requireAuth,redirectIfLoggedIn}
})();
