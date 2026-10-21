(()=>{
  const section=document.querySelector('[data-panel="movies"]');
  const url=window.HALLOWEEN_VOTING?.webAppUrl || '';
  const container=document.createElement('div');
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)){
    const p=document.createElement('p');p.className='note';p.textContent='La votación compartida está pendiente de activar. Las películas y los usuarios se registrarán en Google Sheets.';container.append(p);
  }else{
    const iframe=document.createElement('iframe');iframe.src=url;iframe.title='Votación y histórico del maratón';iframe.style.cssText='width:100%;height:1100px;border:0;background:#111016;color-scheme:dark';container.append(iframe);
    const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener';link.textContent='Abrir votación en una pestaña completa';container.append(link);
  }
  section.replaceChildren(container);
})();
