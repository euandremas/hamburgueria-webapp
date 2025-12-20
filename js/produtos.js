const Produtos={
init(){
 const el=document.getElementById("produtos");
 el.innerHTML=`
 <h2>Produtos</h2>
 <button onclick="Produtos.add()">Adicionar demo</button>
 <ul id="listP"></ul>`;
},
add(){
 Store.produtos.push({id:Store.id.p++,nome:"Burger"});
 this.render();
},
render(){
 listP.innerHTML=Store.produtos.map(p=>`<li>${p.nome}</li>`).join("");
}
};
