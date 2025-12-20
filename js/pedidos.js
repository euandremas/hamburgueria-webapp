const Pedidos={
init(){
 const el=document.getElementById("pedidos");
 el.innerHTML=`
 <h2>Pedidos</h2>
 <button onclick="Pedidos.add()">Criar demo</button>
 <ul id="listO"></ul>`;
},
add(){
 Store.pedidos.push({id:Store.id.o++,status:"Criado"});
 this.render();
},
render(){
 listO.innerHTML=Store.pedidos.map(o=>`<li>#${o.id} - ${o.status}</li>`).join("");
}
};
