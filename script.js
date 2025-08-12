
    const endpoint = 'https://www.dataaccess.com/webservicesserver/NumberConversion.wso';
    
    const proxyPrefix = 'https://corsproxy.io/?url=';

    
    const numInput = document.getElementById('numInput');
    const toWordsBtn = document.getElementById('toWordsBtn');
    const toDollarsBtn = document.getElementById('toDollarsBtn');
    const resultEl = document.getElementById('result');

    toWordsBtn.addEventListener('click', () => doConvert('words'));
    toDollarsBtn.addEventListener('click', () => doConvert('dollars'));

    function setResult(html){
      resultEl.innerHTML = html;
    }

    function showError(err){
      console.error(err);
      setResult(`<span style="color:#b91c1c">Error: ${String(err)}</span>`);
    }

    
    function buildSoapEnvelope(op, value){
      
      if(op === 'NumberToWords'){
        return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <NumberToWords xmlns="http://www.dataaccess.com/webservicesserver/">
      <ubiNum>${escapeXml(value)}</ubiNum>
    </NumberToWords>
  </soap12:Body>
</soap12:Envelope>`;
      } else {
        return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <NumberToDollars xmlns="http://www.dataaccess.com/webservicesserver/">
      <dNum>${escapeXml(value)}</dNum>
    </NumberToDollars>
  </soap12:Body>
</soap12:Envelope>`;
      }
    }

    function escapeXml(unsafe){
      return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }

    
    async function doConvert(mode){
      const rawVal = (numInput.value || '').trim();
      if(!rawVal){
        setResult('<span style="color:#b91c1c">Please enter a number first.</span>');
        return;
      }

      
      if(!/^[-+]?\d*\.?\d+$/.test(rawVal)){
        setResult('<span style="color:#b91c1c">Please enter a valid number (digits, optional decimal point).</span>');
        return;
      }

      setResult('Calling SOAP service… (this may take 1–2s)');

      try {
        const op = mode === 'words' ? 'NumberToWords' : 'NumberToDollars';
        const soapBody = buildSoapEnvelope(op, rawVal);

        
        const url = proxyPrefix + encodeURIComponent(endpoint);

        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/soap+xml; charset=utf-8',
            'Accept': 'application/xml, text/xml'
            
          },
          body: soapBody
        });

        if(!resp.ok){
          const txt = await resp.text().catch(()=> '');
          throw new Error(`HTTP ${resp.status} ${resp.statusText} — ${txt.slice(0,400)}`);
        }

        const txt = await resp.text();
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(txt, 'application/xml');

        
        let found = null;
        const all = xml.getElementsByTagName('*');
        for(let i=0;i<all.length;i++){
          const el = all[i];
          if(el.localName && /Result$/.test(el.localName)){
            found = el;
            break;
          }
        }

        if(found){
       
          setResult(escapeHtml(found.textContent.trim()));
        } else {
          
          setResult(`<pre style="white-space:pre-wrap;font-size:13px">Could not find Result node — raw response:\n\n${escapeHtml(txt.slice(0,2000))}</pre>`);
        }

      } catch (err){
        showError(err);
      }
    }

    function escapeHtml(s){
      return String(s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;');
    }

    
    numInput.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter') doConvert('words');
    });