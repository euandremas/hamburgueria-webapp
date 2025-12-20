const Usuarios={
init(){
 const el=document.getElementById("usuarios");
 el.innerHTML=`
 <h2>Usuários</h2>
 <button onclick="Usuarios.add()">Adicionar demo</button>
 <ul id="listU"></ul>`;
},
add(){
 Store.usuarios.push({id:Store.id.u++,nome:"Cliente"});
 this.render();
},
render(){
 listU.innerHTML=Store.usuarios.map(u=>`<li>${u.nome}</li>`).join("");
}
};
