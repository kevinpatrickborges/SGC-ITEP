import * as THREE from 'https://unpkg.com/three@0.161/build/three.module.js';

export class Armario3D {
  /**
   * @param {Object} opts
   * @param {number} opts.larg  Largura total (m)
   * @param {number} opts.alt   Altura total (m)
   * @param {number} opts.prof  Profundidade total (m)
   * @param {number} opts.nLin  Quantidade de prateleiras horizontais
   * @param {number} opts.nCol  Quantidade de colunas (caixas)
   * @param {string} opts.prefix Prefixo para nomear os nichos (ex. SALA1_ARM1)
   * @param {function} opts.onNichoClick Callback para clique em nicho
   */
  constructor(opts) {
    this.opts = Object.assign({
      larg: 1.2, alt: 1.6, prof: 0.4, nLin: 4, nCol: 3, prefix: 'ARM',
      onNichoClick: null
    }, opts);
    this.group = new THREE.Group();
    this.nichos = [];
    this.highlightedNichos = [];
    this._build();
    this._setupInteraction();
  }

  _build() {
    const { larg, alt, prof, nLin, nCol, prefix } = this.opts;
    const mat = new THREE.MeshLambertMaterial({ color: 0xa79c8e });
    const matShelf = mat.clone(); matShelf.color.setHex(0xbbb8b0);
    const matHighlight = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff0000 });

    // Criar grupo para animação de abertura
    this.doorGroup = new THREE.Group();
    this.group.add(this.doorGroup);

    // Fundo
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(larg, alt, 0.02), mat
    );
    backWall.position.set(0, 0, -prof/2 + 0.01);
    this.doorGroup.add(backWall);

    // Laterais & topo/base
    const sideGeo = new THREE.BoxGeometry(0.02, alt, prof);
    const leftSide = new THREE.Mesh(sideGeo, mat).translateX(-larg/2);
    const rightSide = new THREE.Mesh(sideGeo, mat).translateX(larg/2);
    this.doorGroup.add(leftSide);
    this.doorGroup.add(rightSide);

    const topGeo = new THREE.BoxGeometry(larg, 0.02, prof);
    const topShelf = new THREE.Mesh(topGeo, mat).translateY(alt/2);
    const bottomShelf = new THREE.Mesh(topGeo, mat).translateY(-alt/2);
    this.doorGroup.add(topShelf);
    this.doorGroup.add(bottomShelf);

    // Prateleiras + divisórias verticais
    const dx = larg / nCol;
    const dy = alt / (nLin + 1);

    // prateleiras horizontais
    for (let i = 1; i <= nLin; i++) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(larg, 0.02, prof), matShelf);
      shelf.position.y = i * dy - alt/2;
      this.doorGroup.add(shelf);
    }

    // divisórias verticais
    for (let c = 1; c < nCol; c++) {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, alt, prof), mat);
      wall.position.x = c * dx - larg/2;
      this.doorGroup.add(wall);
    }

    // Nichos individuais p/ raycast & highlight
    const nichoGeo = new THREE.BoxGeometry(dx - 0.04, dy - 0.04, prof - 0.04);
    nichoGeo.translate(0, 0, 0.02); // p/ não colidir com o fundo

    for (let l = 0; l <= nLin; l++) {
      for (let c = 0; c < nCol; c++) {
        const nicho = new THREE.Mesh(nichoGeo, matShelf);
        nicho.visible = false; // invisível mas "clicável"
        nicho.name = `${prefix}_L${l+1}C${c+1}`; // ex: SALA1_ARM1_L2C3
        nicho.position.set(
          c * dx - larg/2 + dx/2,
          l * dy - alt/2 + dy/2,
          -prof/2 + prof/2
        );
        nicho.userData = {
          codigo: nicho.name,
          linha: l+1,
          coluna: c+1
        };
        this.nichos.push(nicho);
        this.doorGroup.add(nicho);
      }
    }
  }

  _setupInteraction() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    window.addEventListener('click', (event) => this._onMouseClick(event), false);
  }

  _onMouseClick(event) {
    event.preventDefault();

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.opts.camera);

    const intersects = this.raycaster.intersectObjects(this.nichos);

    if (intersects.length > 0) {
      const nicho = intersects[0].object;
      if (this.opts.onNichoClick) {
        this.opts.onNichoClick(nicho.userData);
      }
    }
  }

  highlight(codigo, color = 0xff0000) {
    this.clearHighlights();

    const alvo = this.doorGroup.getObjectByName(codigo);
    if (!alvo) return;

    alvo.visible = true;
    const highlightMaterial = new THREE.MeshLambertMaterial({
      color: color,
      emissive: color,
      opacity: 0.7,
      transparent: true
    });
    alvo.material = highlightMaterial;
    this.highlightedNichos.push(alvo);
  }

  clearHighlights() {
    this.highlightedNichos.forEach(nicho => {
      nicho.material = new THREE.MeshLambertMaterial({ color: 0xbbb8b0 });
      nicho.visible = false;
    });
    this.highlightedNichos = [];
  }

  animateOpen(duration = 1000) {
    return new Promise((resolve) => {
      const startRotation = this.doorGroup.rotation.y;
      const targetRotation = Math.PI / 2; // 90 graus

      const animate = (progress) => {
        this.doorGroup.rotation.y = THREE.MathUtils.lerp(startRotation, targetRotation, progress);
      };

      this._animate(animate, duration, resolve);
    });
  }

  animateClose(duration = 1000) {
    return new Promise((resolve) => {
      const startRotation = this.doorGroup.rotation.y;
      const targetRotation = 0;

      const animate = (progress) => {
        this.doorGroup.rotation.y = THREE.MathUtils.lerp(startRotation, targetRotation, progress);
      };

      this._animate(animate, duration, resolve);
    });
  }

  _animate(animateFunc, duration, onComplete) {
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      animateFunc(progress);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        onComplete();
      }
    };

    requestAnimationFrame(update);
  }

  zoomToNicho(codigo, camera) {
    const nicho = this.doorGroup.getObjectByName(codigo);
    if (!nicho) return;

    const targetPosition = nicho.position.clone();
    targetPosition.z += 1; // Move a câmera um pouco para frente

    // Animação suave de zoom
    const startPosition = camera.position.clone();
    const startLookAt = new THREE.Vector3(0, 0, 0);
    const targetLookAt = nicho.position.clone();

    const animate = (progress) => {
      camera.position.lerpVectors(startPosition, targetPosition, progress);
      const lookAtPosition = new THREE.Vector3();
      lookAtPosition.lerpVectors(startLookAt, targetLookAt, progress);
      camera.lookAt(lookAtPosition);
    };

    return new Promise((resolve) => {
      this._animate(animate, 1000, resolve);
    });
  }
}
