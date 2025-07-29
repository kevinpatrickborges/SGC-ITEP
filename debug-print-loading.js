const puppeteer = require('puppeteer');

(async () => {
  console.log('=== DEBUG: PROBLEMA DE CARREGAMENTO INFINITO NA IMPRESSÃO ===\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Interceptar todos os requests para identificar problemas
  page.on('request', request => {
    console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status >= 400) {
      console.log(`❌ ERRO ${status}: ${url}`);
    } else {
      console.log(`✅ OK ${status}: ${url}`);
    }
  });
  
  // Interceptar erros de console
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`🖥️  CONSOLE [${type.toUpperCase()}]: ${text}`);
  });
  
  // Interceptar erros JavaScript
  page.on('pageerror', error => {
    console.log(`💥 ERRO JS: ${error.message}`);
  });
  
  try {
    console.log('=== FAZENDO LOGIN ===');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle2' });
    
    await page.type('#matricula', 'admin');
    await page.type('#senha', 'admin');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Login realizado');
    
    console.log('\n=== NAVEGANDO PARA TEMPLATE ===');
    await page.goto('http://localhost:3000/nugecid/gerar-template/86654e4a-7caa-4471-a9f7-e6506b4408bb', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('✅ Página carregada');
    
    // Aguardar um pouco para garantir que tudo carregou
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n=== VERIFICANDO ELEMENTOS DA PÁGINA ===');
    
    // Verificar se há elementos que podem estar causando problemas
    const pageInfo = await page.evaluate(() => {
      const info = {
        title: document.title,
        readyState: document.readyState,
        hasQuill: !!window.Quill,
        hasEditor: !!document.querySelector('.ql-editor'),
        hasContent: !!document.querySelector('#editor-container'),
        loadingElements: [],
        errorElements: [],
        scripts: [],
        stylesheets: []
      };
      
      // Verificar elementos de loading
      const loadingSelectors = ['.loading', '.spinner', '[data-loading]', '.fa-spin'];
      loadingSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          info.loadingElements.push({
            selector,
            count: elements.length,
            visible: Array.from(elements).some(el => el.offsetParent !== null)
          });
        }
      });
      
      // Verificar scripts
      document.querySelectorAll('script[src]').forEach(script => {
        info.scripts.push({
          src: script.src,
          loaded: script.readyState === 'complete' || !script.readyState
        });
      });
      
      // Verificar stylesheets
      document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        info.stylesheets.push({
          href: link.href,
          loaded: link.sheet !== null
        });
      });
      
      return info;
    });
    
    console.log('📊 INFORMAÇÕES DA PÁGINA:');
    console.log('   - Título:', pageInfo.title);
    console.log('   - Estado:', pageInfo.readyState);
    console.log('   - Quill disponível:', pageInfo.hasQuill);
    console.log('   - Editor presente:', pageInfo.hasEditor);
    console.log('   - Container de conteúdo:', pageInfo.hasContent);
    
    if (pageInfo.loadingElements.length > 0) {
      console.log('\n⚠️  ELEMENTOS DE LOADING ENCONTRADOS:');
      pageInfo.loadingElements.forEach(el => {
        console.log(`   - ${el.selector}: ${el.count} elementos, visível: ${el.visible}`);
      });
    }
    
    console.log('\n=== TESTANDO IMPRESSÃO ===');
    
    // Interceptar window.print
    await page.evaluateOnNewDocument(() => {
      window.originalPrint = window.print;
      window.printCalled = false;
      window.print = function() {
        console.log('🖨️  window.print() foi chamado!');
        window.printCalled = true;
        // Não chamar o print real para evitar abrir a janela
        // window.originalPrint();
      };
    });
    
    // Tentar clicar no botão de impressão
    const printButton = await page.$('#btnImprimir');
    if (printButton) {
      console.log('✅ Botão de impressão encontrado');
      
      console.log('🖱️  Clicando no botão de impressão...');
      await printButton.click();
      
      // Aguardar um pouco para ver o que acontece
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verificar se o print foi chamado
      const printResult = await page.evaluate(() => {
        return {
          printCalled: window.printCalled,
          buttonState: {
            disabled: document.getElementById('btnImprimir')?.disabled,
            innerHTML: document.getElementById('btnImprimir')?.innerHTML
          }
        };
      });
      
      console.log('📊 RESULTADO DA IMPRESSÃO:');
      console.log('   - Print chamado:', printResult.printCalled);
      console.log('   - Botão desabilitado:', printResult.buttonState.disabled);
      console.log('   - Texto do botão:', printResult.buttonState.innerHTML);
      
    } else {
      console.log('❌ Botão de impressão não encontrado');
    }
    
    console.log('\n=== AGUARDANDO PARA INSPEÇÃO MANUAL ===');
    console.log('Mantendo navegador aberto por 30 segundos...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    await browser.close();
  }
})();