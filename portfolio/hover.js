// Weight-follows-pointer effect on the hero heading, same as the home page.
(function(){
  var hero=document.querySelector(".hero"),h1=hero&&hero.querySelector("h1");
  if(!h1||!window.matchMedia("(hover:hover) and (pointer:fine)").matches||window.matchMedia("(prefers-reduced-motion:reduce)").matches)return;
  if(!h1.hasAttribute("aria-label"))h1.setAttribute("aria-label",h1.textContent);
  var text=h1.textContent,chars=[];h1.textContent="";
  var wrap=document.createElement("span");wrap.setAttribute("aria-hidden","true");h1.appendChild(wrap);
  text.split(" ").forEach(function(word,i,a){
    var w=document.createElement("span");w.style.cssText="display:inline-block;white-space:nowrap";
    word.split("").forEach(function(c){var s=document.createElement("span");s.style.display="inline-block";s.textContent=c;w.appendChild(s);chars.push(s)});
    wrap.appendChild(w);if(i<a.length-1)wrap.appendChild(document.createTextNode(" "));
  });
  var MIN=300,MAX=800,REST=600,weight=chars.map(function(){return REST}),target=chars.map(function(){return REST});
  var px=null,py=null,running=false;
  function aim(){
    var box=h1.getBoundingClientRect(),r=Math.max(140,box.width/5);
    for(var i=0;i<chars.length;i++){
      var b=chars[i].getBoundingClientRect(),dx=b.left+b.width/2-px,dy=b.top+b.height/2-py,d=Math.sqrt(dx*dx+dy*dy)/r;
      target[i]=MIN+(MAX-MIN)*Math.exp(-d*d);
    }
  }
  function tick(){
    if(px!==null)aim();else for(var i=0;i<target.length;i++)target[i]=REST;
    var moving=false;
    for(var j=0;j<chars.length;j++){
      var diff=target[j]-weight[j];weight[j]+=diff*0.14;
      if(Math.abs(diff)>0.6)moving=true;
      chars[j].style.fontWeight=Math.round(weight[j]);
    }
    if(moving||px!==null)requestAnimationFrame(tick);else running=false;
  }
  function go(){if(!running){running=true;requestAnimationFrame(tick)}}
  hero.addEventListener("pointermove",function(e){px=e.clientX;py=e.clientY;go()});
  hero.addEventListener("pointerleave",function(){px=null;py=null;go()});
})();
