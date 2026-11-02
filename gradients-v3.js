/* Pre-meeting spotlight, with increasing cloud intensity and a soft heart-shaped finish. */
(() => {
  const hero = document.querySelector('.hero');
  const art = document.querySelector('.gradient-art');
  const canvas = document.querySelector('.gradient-canvas');
  const pauseButton = document.querySelector('.gradient-pause');
  const caption = document.querySelector('.gradient-caption');
  const choices = [...document.querySelectorAll('[data-gradient-choice]')];
  const isReview = Boolean(document.querySelector('.gradient-review, [data-gradient-picker]'));
  const field = document.querySelector('#prompt');
  const composer = document.querySelector('.composer');
  const replayButton = document.querySelector('.gradient-replay');
  const rim = document.createElement('span');
  rim.className = 'aperture-glow';
  rim.setAttribute('aria-hidden','true');
  composer.append(rim);
  let source = [.5,.5,.5];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const variants = {
    sunset: { mode: 4, palette: 1, duration: 4.7, caption: '1 · Туман: персик, коралл, розовый и голубой; мягкая форма сердца' },
    cloud: { mode: 4, palette: 2, duration: 4.7, caption: '2 · Облако: та же палитра, более широкое асимметричное раскрытие' },
    halo: { mode: 4, palette: 3, duration: 4.7, caption: '3 · Ореол: та же палитра, более глубокая светлая впадина' },
  };
  let selected = 'halo';
  let paused = false;
  let typing = false;
  let visible = true;
  let pageActive = true;
  let frame = 0;
  let lastFrame = 0;
  let time = 7;
  let renderer = null;

  const vertexSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * .5 + .5;
      gl_Position = vec4(a_position, 0., 1.);
    }
  `;
  const fragmentSource = `
    precision highp float;
    varying vec2 v_uv;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform int u_palette;
    uniform vec3 u_source;
    const vec3 paper = vec3(.97255,.97255,.96863);
    float bell(float x) { return exp(-x*x); }
    float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    // Palette from the supplied Skatoolka reference; geometry and timing stay intact.
    vec3 referencePalette(vec2 uv) {
      vec3 pink = vec3(1.,.52,.79);
      vec3 coral = vec3(1.,.37,.49);
      vec3 peach = vec3(1.,.68,.47);
      vec3 blue = vec3(.29,.49,1.);
      vec3 pigment = mix(pink,coral,smoothstep(.43,.72,uv.y));
      pigment = mix(pigment,peach,smoothstep(.73,1.05,uv.y));
      float cool = bell((uv.x-.96)/.35)*bell((uv.y-.25)/.32)*.94
                 + bell((uv.x-.02)/.27)*bell((uv.y-.25)/.24)*.38;
      pigment = mix(pigment,blue,clamp(cool,0.,1.));
      float cream = bell((uv.x-.49)/.36)*bell((uv.y-1.05)/.22);
      return mix(pigment,vec3(1.,.91,.78),cream*.62);
    }
    float heartDistance(vec2 uv) {
      float centre = .51;
      float dipWidth = .24;
      float dipDepth = .23;
      float softness = .20;
      float drift = .012*sin(uv.x*5.);
      if(u_palette==2) {
        centre=.56; dipWidth=.29; dipDepth=.18; softness=.25;
        drift=.04*sin(uv.x*5.5+.6);
      }
      if(u_palette==3) {
        centre=.49; dipWidth=.28; dipDepth=.29; softness=.23;
      }
      float horizon = .31+dipDepth*bell((uv.x-centre)/dipWidth)+drift;
      return max(0.,(horizon+.08-uv.y)/softness);
    }
    // Original spotlight timing and cone from the pre-meeting landing.
    // Only its existing diffuse cloud grows into the final colour field.
    vec3 opening(vec2 uv, float t) {
      float aspect = u_resolution.x/u_resolution.y;
      vec2 p = vec2((uv.x-u_source.x)*aspect,u_source.y-uv.y);
      float inputWidth = u_source.z*aspect;
      float ignite = smoothstep(.10,.70,t);
      float rise = smoothstep(.48,2.0,t);
      // Intensity only increases from 0 to 100%; expansion must never dim the source.
      float progress = smoothstep(.10,4.7,t);
      float energy = ignite;
      float release = smoothstep(1.15,4.8,t);
      float above = smoothstep(-.006,.010,p.y);
      float reach = .025+rise*.53;
      float endFade = 1.-smoothstep(reach*.53,reach,p.y);
      float atmosphere = exp(-dot(p/vec2(.78,.53),p/vec2(.78,.53)));
      vec3 col = mix(paper,mix(paper,referencePalette(uv),.28),atmosphere*energy*mix(.46,.60,progress));

      // Deform this cloud's spatial field, rather than crossfading two images.
      // The same release that opens the original cone also unfolds its lobes.
      float approach = smoothstep(1.15,4.7,t);
      vec2 q = p-vec2(-.10*release,.12+.14*release);
      vec2 size = vec2(.35+release*.70,.16+release*.40);
      float originalDistance = length(q/size);
      float distance = mix(originalDistance,heartDistance(uv),approach);
      float cloud = exp(-distance*distance);
      float halo = release;
      vec3 tint = mix(paper,referencePalette(uv),1./2.45);
      // Increase the density of the original pigment, without changing hue.
      tint = clamp(paper+(tint-paper)*(1.+1.45*approach),0.,1.);
      float intensity = mix(.33,.88,approach);
      col = mix(col,tint,cloud*halo*intensity);
      float white = exp(-dot(q/(size*.64),q/(size*.64)));
      col = mix(col,vec3(1.,.998,.97),white*halo*.66);

      float spread = .15+rise*.96+release*.65;
      float width = inputWidth*.115+max(0.,p.y)*spread+release*.20;
      float axis = p.x+p.y*.13;
      float edge = abs(axis)/width;
      float cone = (1.-smoothstep(.80-release*.35,1.20+release*.65,edge))*above*endFade;
      float core = (1.-smoothstep(.05,.89,edge))*above*endFade;
      vec3 gold = referencePalette(uv);
      col = mix(col,gold,cone*energy*.39);
      col = mix(col,vec3(1.,.998,.955),core*energy*mix(.92,1.,progress));
      float fringe = bell((edge-.99)*15.)*above*endFade;
      col = mix(col,vec3(.93,.66,.86),fringe*energy*.17);
      float shaft = bell(axis/(width*.22))*above*endFade;
      col = mix(col,vec3(1.,1.,.97),shaft*energy*.33);
      float glow = bell(p.x/max(.01,inputWidth*.16))*bell(p.y/.022);
      return mix(col,vec3(1.,.988,.90),glow*ignite*mix(.88,1.,progress));
    }
    void main() {
      vec2 uv = vec2(v_uv.x,1.-v_uv.y);
      vec3 color = opening(uv,u_time);
      // Add 40% saturation gradually as the light reaches its final shape.
      float saturation = 1. + .40 * smoothstep(1.15,4.7,u_time);
      float luminance = dot(color,vec3(.2126,.7152,.0722));
      color = clamp(mix(vec3(luminance),color,saturation),0.,1.);
      color += (hash(gl_FragCoord.xy)-.5)/255.;
      gl_FragColor = vec4(color,1.);
    }

  `;

  function createRenderer() {
    const gl = canvas.getContext('webgl', { alpha:false, antialias:false, depth:false, stencil:false, powerPreference:'low-power' });
    if (!gl || gl.isContextLost()) return null;
    const shaders = [];
    let program;
    let buffer;
    try {
      function compile(type, source) {
        const shader = gl.createShader(type);
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
        return shader;
      }
      program = gl.createProgram();
      gl.attachShader(program,compile(gl.VERTEX_SHADER,vertexSource));
      gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      shaders.forEach(shader => gl.deleteShader(shader));
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program,'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      const resolution = gl.getUniformLocation(program,'u_resolution');
      const clock = gl.getUniformLocation(program,'u_time');
      const mode = gl.getUniformLocation(program,'u_mode');
      const palette = gl.getUniformLocation(program,'u_palette');
      const emitter = gl.getUniformLocation(program,'u_source');
      art.dataset.renderer = 'webgl';
      return {
        draw() {
          gl.viewport(0,0,canvas.width,canvas.height);
          gl.uniform2f(resolution,canvas.width,canvas.height);
          gl.uniform1f(clock,time);
          gl.uniform1i(mode,variants[selected].mode);
          gl.uniform1i(palette,variants[selected].palette ?? 0);
          gl.uniform3fv(emitter,source);
          gl.drawArrays(gl.TRIANGLES,0,6);
          paintRim();
        },
      };
    } catch (error) {
      shaders.forEach(shader => gl.deleteShader(shader));
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      console.warn('Gradient artwork uses its static fallback:', error.message);
      return null;
    }
  }

  function shouldAnimate() {
    return renderer && selected !== 'original' && !(isOpening() && time >= duration()) && !paused && !typing && !reduceMotion.matches && visible && !document.hidden && pageActive;
  }
  function isOpening() { return variants[selected].mode >= 4; }
  function duration() { return variants[selected].duration ?? 7; }
  function smooth(a,b,t) { const x = Math.max(0,Math.min(1,(t-a)/(b-a))); return x*x*(3-2*x); }
  function paintRim() {
    // Keep the source growing with the background; no peak-and-decay envelope.
    const ignite = smooth(.10,.55,time);
    const progress = smooth(.10,duration(),time);
    const strength = ignite*(.85+.15*progress);
    const burst = ignite*(.65+.35*progress);
    rim.style.setProperty('--aperture-burst', String(burst));
    rim.style.opacity = String(strength);
    rim.style.transform = `scaleX(${.88+smooth(.15,1.10,time)*.12})`;
  }
  function tick(now) {
    frame = 0;
    if (!shouldAnimate()) return;
    // 30 fps and a capped drawing buffer keep a decorative canvas inexpensive.
    if (!lastFrame || now-lastFrame >= 1000/30) {
      const speed = (variants[selected].mode === 4 || variants[selected].mode === 5 ? 2.4 : 2) * (Number(document.body.dataset.gradientSpeed) || 1);
      time += lastFrame ? Math.min((now-lastFrame)/1000,.08)*speed : 0;
      if (isOpening()) time = Math.min(time,duration());
      lastFrame = now;
      renderer.draw();
    }
    if (shouldAnimate()) frame = requestAnimationFrame(tick);
    else syncMotion();
  }
  function syncMotion() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
    if (pauseButton) {
      pauseButton.disabled = selected === 'original' || !renderer || reduceMotion.matches || (isOpening() && time >= duration());
      pauseButton.textContent = reduceMotion.matches ? 'Без движения' : isOpening() && time >= duration() ? 'Завершено' : paused ? 'Продолжить' : 'Пауза';
      pauseButton.setAttribute('aria-pressed',String(paused));
    }
    if (replayButton) replayButton.disabled = selected === 'original' || reduceMotion.matches;
    if (shouldAnimate()) frame = requestAnimationFrame(tick);
  }
  function resize() {
    const bounds = (document.body.classList.contains('suisse') ? art : hero).getBoundingClientRect();
    const input = composer.getBoundingClientRect();
    source = [(input.left+input.width/2-bounds.left)/bounds.width,(input.top-bounds.top)/bounds.height,input.width/bounds.width];
    const scale = Math.min(devicePixelRatio || 1,1.25,1400/bounds.width);
    const width = Math.max(1,Math.round(bounds.width*scale));
    const height = Math.max(1,Math.round(bounds.height*scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    if (selected !== 'original') renderer?.draw();
  }
  function select(key, updateURL = true) {
    selected = Object.hasOwn(variants,key) ? key : 'halo';
    if (!isReview || key === null) selected = 'halo';
    time = isOpening() ? (reduceMotion.matches ? duration() : 0) : 7;
    paused = false;
    hero.dataset.gradient = selected;
    hero.dataset.lightShape = variants[selected].mode === 4 ? 'spotlight' : '';
    hero.dataset.lightPalette = String(variants[selected].palette ?? 0);
    choices.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.gradientChoice === selected)));
    if (caption) caption.textContent = variants[selected].caption;
    if (selected !== 'original' && !renderer) renderer = createRenderer();
    resize();
    paintRim();
    syncMotion();
    if (updateURL && isReview) {
      const url = new URL(location.href);
      url.searchParams.set('gradient',selected);
      history.replaceState(null,'',url);
    }
  }
  choices.forEach(button => button.addEventListener('click',() => select(button.dataset.gradientChoice)));
  pauseButton?.addEventListener('click',() => { paused = !paused; syncMotion(); });
  function replay() {
    if (reduceMotion.matches) return;
    scrollTo({top:0,behavior:'instant'});
    time = isOpening() ? 0 : 7;
    paused = false;
    typing = false;
    renderer?.draw();
    syncMotion();
  }
  replayButton?.addEventListener('click',replay);
  document.addEventListener('hero-light-replay',replay);
  field.addEventListener('input',() => { typing = true; syncMotion(); });
  field.addEventListener('compositionstart',() => { typing = true; syncMotion(); });
  field.addEventListener('blur',() => { typing = false; syncMotion(); });
  reduceMotion.addEventListener('change',() => {
    if (reduceMotion.matches && isOpening()) { time = duration(); renderer?.draw(); }
    syncMotion();
  });
  document.addEventListener('visibilitychange',syncMotion);
  new ResizeObserver(resize).observe(hero);
  new ResizeObserver(resize).observe(composer);
  document.fonts.ready.then(resize);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncMotion(); }).observe(hero);
  window.addEventListener('pagehide',() => { pageActive = false; syncMotion(); });
  window.addEventListener('pageshow',() => { pageActive = true; syncMotion(); });
  window.addEventListener('popstate',() => select(new URL(location.href).searchParams.get('gradient'),false));
  canvas.addEventListener('webglcontextlost',event => {
    event.preventDefault();
    renderer = null;
    art.dataset.renderer = 'fallback';
    syncMotion();
  });
  canvas.addEventListener('webglcontextrestored',() => { renderer = createRenderer(); resize(); syncMotion(); });
  select(new URL(location.href).searchParams.get('gradient'),false);
})();
