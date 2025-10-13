<!-- public/assets/common.js -->
<script>
function toast(msg,type='info'){
  const d=document.createElement('div');
  d.style.cssText='position:fixed;top:20px;right:20px;z-index:9999;padding:12px 16px;border-radius:10px;color:#fff;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.2)';
  d.style.background=type==='ok'?'#10B981':type==='warn'?'#F59E0B':type==='err'?'#EF4444':'#FF6B35';
  d.textContent=msg;document.body.appendChild(d);
  setTimeout(()=>{d.style.transform='translateX(120%)';d.style.transition='transform .25s';setTimeout(()=>d.remove(),260)},3500);
}
</script>
