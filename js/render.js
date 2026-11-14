'use strict';
/* THEERAM — renderer: HDR pipeline, sky, sun/moon, screen-space ray-traced water, AO, light shafts, rain */
(function () {
  const V3 = THREE.Vector3;
  const env = G.env = { hour: 16.9, day: 1, cloud: .3, rain: 0, tCloud: .3, tRain: 0, wNext: 3, wet: 0, sunDir: new V3(0, 1, 0), moonDir: new V3(0, -1, 0), lightDir: new V3(0, 1, 0), dayF: 1, night: 0, amb: 1, flash: 0, flashT: 20, HOUR: 46 };
  const SKY = `
  uniform vec3 uSunDir,uSunCol,uZen,uHor,uMoonDir; uniform float uCloud,uTime,uNight; uniform sampler2D tNoise;
  float nz(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return texture2D(tNoise,(i+f+.5)/256.).r; }
  float fbm(vec2 p){ return nz(p)*.5+nz(p*2.03+7.3)*.25+nz(p*4.01+1.7)*.125+nz(p*8.1+4.)*.0625; }
  float fbm3(vec2 p){ return nz(p)*.57+nz(p*2.03+7.3)*.29+nz(p*4.01+1.7)*.14; }
  vec3 skyCol(vec3 d, float hq){
    float y=max(d.y,0.), sd=max(dot(d,uSunDir),0.), low=1.-smoothstep(0.,.45,uSunDir.y);
    vec3 c=mix(uHor,mix(uHor,uZen,.55),smoothstep(0.,.22,y)); c=mix(c,uZen,smoothstep(.12,.85,y)); c+=vec3(.20,.09,.12)*low*pow(1.-y,5.)*(1.-sd)*(1.-uNight)*(1.-uCloud)*.5;
    c+=uSunCol*pow(sd,3.)*pow(1.-y,4.)*.16*(1.+2.2*low)*(1.-uCloud*.6);
    c+=uSunCol*(pow(sd,12.)*.03+pow(sd,120.)*.16+pow(sd,1500.)*.6*hq)*(1.-uCloud*.6);
    c+=uSunCol*hq*smoothstep(.99965,.99985,sd)*(14.+10.*smoothstep(.99985,1.,sd))*(1.-uCloud);
    float md=max(dot(d,uMoonDir),0.), mdisc=smoothstep(.99955,.9997,md), mtex=.7+.3*nz(d.xz*90.+d.y*60.)-.28*smoothstep(.45,.6,nz(d.xy*38.+3.)); c=mix(c,vec3(.78,.83,.95)*mtex*1.7,mdisc*hq*uNight*(1.-uCloud*.8)); c+=uNight*vec3(.5,.6,.9)*(pow(md,300.)*.25+pow(md,30.)*.03)*(1.-uCloud*.8);
    if(d.y>-.03){
      vec2 uv=d.xz/(d.y+.16)*1.6+uTime*vec2(.012,.005);
      float ci=smoothstep(.5,.85,fbm3(uv*vec2(.35,1.6)+vec2(uTime*.02,3.)))*.45*(1.-uCloud*.5)*smoothstep(0.,.2,d.y);
      c=mix(c,uHor*.7+uSunCol*(.25+.6*pow(sd,6.)),ci*(.6+.4*hq));
      vec2 wv=uv+vec2(fbm3(uv*.7+11.),fbm3(uv*.7+23.))*.55*hq;
      float f=fbm(wv), f2=fbm(wv*2.3-uTime*.008+3.);
      float dens=smoothstep(.56-uCloud*.36,.74-uCloud*.30,f*.72+f2*.34);
      vec2 ld=normalize(uSunDir.xz+vec2(.001))*.22;
      float sh=smoothstep(.5-uCloud*.3,.8-uCloud*.3,fbm3(wv+ld));
      sh=mix(sh,(sh+smoothstep(.5-uCloud*.3,.8-uCloud*.3,fbm3(wv+ld*2.2)))*.55,hq);
      sh=clamp(sh*(.6+.5*uCloud),0.,1.);
      float edge=dens*(1.-dens)*4.;
      vec3 lit=uHor*1.05+uSunCol*(.30+.9*pow(sd,5.)*edge)*(1.-uCloud*.55);
      vec3 dk=(uZen*.42+uHor*.22)*(1.-.45*uCloud*uCloud);
      vec3 cc=mix(lit,dk,clamp(sh*.85+dens*.2,0.,1.))+uSunCol*low*.12*(1.-sh);
      c=mix(c,cc,dens*smoothstep(-.03,.10,d.y));
    }
    return c;
  }`;
  const COAST = 'float coast(float z){ return 40.*sin(z*.0035+.6)+18.*sin(z*.011+2.)-95.*exp(-pow((z-560.)/55.,2.))+70.*exp(-pow((z-700.)/90.,2.)); }';
  const FSV = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';

  G.initRender = () => {
    const Q = G.Q(), el = document.getElementById('game');
    const r = G.renderer = new THREE.WebGLRenderer({ canvas: el, antialias: false, powerPreference: 'high-performance', stencil: false });
    r.setPixelRatio(1); r.autoClear = false; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = G.scene; scene.fog = new THREE.FogExp2(0x8899aa, .002);
    const cam = G.camera = new THREE.PerspectiveCamera(G.set.fov, 1, .12, 2600); scene.add(cam);
    G.sceneB = new THREE.Scene(); G.sceneVM = new THREE.Scene(); G.camVM = new THREE.PerspectiveCamera(52, 1, .01, 20);
    const scenePost = new THREE.Scene(), ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const half = r.capabilities.isWebGL2 && r.extensions.get('EXT_color_buffer_float');
    const mkRT = depthTex => { const t = new THREE.WebGLRenderTarget(4, 4, { type: half ? THREE.HalfFloatType : THREE.UnsignedByteType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, stencilBuffer: false }); if (depthTex) { t.depthTexture = new THREE.DepthTexture(4, 4); t.depthTexture.type = THREE.UnsignedIntType; t.depthTexture.minFilter = t.depthTexture.magFilter = THREE.NearestFilter; } return t; };
    const rtA = mkRT(true), rtB = mkRT(false);
    /* lights */
    const sun = G.sun = new THREE.DirectionalLight(0xffffff, 3); sun.castShadow = true; sun.shadow.mapSize.set(Q.shadow, Q.shadow);
    const sc = sun.shadow.camera; sc.left = -58; sc.right = 58; sc.top = 58; sc.bottom = -58; sc.near = 1; sc.far = 520; sun.shadow.bias = -.0005; sun.shadow.normalBias = .04;
    scene.add(sun, sun.target);
    const hemi = G.hemi = new THREE.HemisphereLight(0xffffff, 0x554433, 1); scene.add(hemi);
    const spot = G.flash = new THREE.SpotLight(0xfff0d8, 0, 55, .5, .55, 1.2); spot.position.set(.25, -.2, 0); spot.target.position.set(.05, -.05, -1); cam.add(spot, spot.target);
    if (Q.spotShadow) { spot.castShadow = true; spot.shadow.mapSize.set(512, 512); spot.shadow.camera.near = .4; spot.shadow.camera.far = 50; spot.shadow.bias = -.002; }
    G.plights = []; for (let i = 0; i < 3; i++) { const p = new THREE.PointLight(0xffaa55, 0, 22, 1.6); p.userData.life = 0; scene.add(p); G.plights.push(p); }
    // night: the three nearest street lamps cast real light, every lamp gets a glow
    G.lampLights = []; for (let i = 0; i < 3; i++) { const p = new THREE.PointLight(0xffb468, 0, 34, 1.3); scene.add(p); G.lampLights.push(p); }
    { const lp = []; for (const l of G.lamps) lp.push(l[0], l[1] - .15, l[2]); const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
      const ht = canvasTex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.2, 'rgba(255,220,160,.6)'); g.addColorStop(1, 'rgba(255,180,90,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }, { repeat: false });
      G.lampGlow = new THREE.Points(lg, new THREE.PointsMaterial({ map: ht, size: 3.4, sizeAttenuation: true, color: new THREE.Color(2.4, 1.6, .7), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); G.lampGlow.frustumCulled = false; G.sceneB.add(G.lampGlow); }
    let lampT = 0;
    G.fireLight = new THREE.PointLight(0xff7a2a, 0, 26, 1.5); scene.add(G.fireLight);
    G.sceneVM.add(G.vmAmb = new THREE.AmbientLight(0xffffff, .5)); G.vmDir = new THREE.DirectionalLight(0xffffff, .8); G.vmDir.position.set(-.4, 1, .5); G.sceneVM.add(G.vmDir);
    G.vmFlash = new THREE.PointLight(0xffc070, 0, 3); G.vmFlash.position.set(.1, 0, -.9); G.sceneVM.add(G.vmFlash);
    /* sky */
    const skyU = G.skyU = { uSunDir: { value: env.sunDir }, uMoonDir: { value: env.moonDir }, uSunCol: { value: new THREE.Color() }, uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uCloud: { value: .3 }, uTime: { value: 0 }, uNight: { value: 0 }, tNoise: { value: G.noiseTex } };
    const sky = G.sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.ShaderMaterial({
      uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
      vertexShader: 'varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: SKY + `varying vec3 vD;
      float h21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      void main(){ vec3 d=normalize(vD); vec3 c=skyCol(d,1.);
        if(uNight>.01 && d.y>0.){ float mw=pow(max(0.,1.-abs(dot(d,normalize(vec3(.35,.45,.82))))*2.4),2.)*fbm3(d.xz*7.+d.y*5.); c+=uNight*(1.-uCloud)*mw*vec3(.045,.055,.085); vec2 g2=d.xz/(d.y+.4)*310.; vec2 i2=floor(g2); float s2=h21(i2+11.); c+=uNight*(1.-uCloud)*step(.9,s2)*smoothstep(.2,.0,length(fract(g2)-.5))*vec3(.9,.9,1.)*.35*(.5+.5*sin(uTime*2.+s2*40.)); vec2 g=d.xz/(d.y+.4)*140.; vec2 id=floor(g); float s=h21(id); vec2 f=fract(g)-.5-(vec2(h21(id+3.),h21(id+7.))-.5)*.6; c+=uNight*(1.-uCloud)*step(.93,s)*smoothstep(.09,.0,length(f))*vec3(.8,.85,1.)*(.3+s)*1.4; }
        gl_FragColor=vec4(c,1.); }`
    }));
    sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
    /* copy + AO quad (first thing drawn into rtB; also writes depth) */
    const quadG = new THREE.PlaneGeometry(2, 2);
    const copyU = { tColor: { value: rtA.texture }, tDepth: { value: rtA.depthTexture }, tNoise: { value: G.noiseTex }, uPI: { value: new THREE.Matrix4() }, uPM: { value: new THREE.Matrix4() }, uCamW: { value: new THREE.Matrix4() }, uP11: { value: 1 }, uRes: { value: new THREE.Vector2() }, uAO: { value: Q.ao }, uLightV: { value: new V3() }, uShade: { value: 1 }, uWet: { value: 0 }, uRT: { value: 1 }, uSkyC: { value: new THREE.Color() }, uSunV: { value: new V3() }, uSunC: { value: new THREE.Color() }, uHaze: { value: .002 } };
    const copy = new THREE.Mesh(quadG, new THREE.ShaderMaterial({
      uniforms: copyU, depthFunc: THREE.AlwaysDepth, extensions: { fragDepth: true, derivatives: true }, fog: false, vertexShader: FSV,
      fragmentShader: `uniform sampler2D tColor,tDepth,tNoise; uniform mat4 uPI,uPM,uCamW; uniform float uP11,uAO,uShade,uWet,uRT; uniform vec2 uRes; uniform vec3 uLightV,uSkyC,uSunV,uSunC; uniform float uHaze; varying vec2 vUv;
      vec3 vp(vec2 uv){ float d=texture2D(tDepth,uv).x; vec4 p=uPI*vec4(uv*2.-1.,d*2.-1.,1.); return p.xyz/p.w; }
      vec2 pj(vec3 p){ vec4 c=uPM*vec4(p,1.); return c.xy/c.w*.5+.5; }
      void main(){ vec3 c=texture2D(tColor,vUv).rgb; float d=texture2D(tDepth,vUv).x;
        if(d<.99995){ vec3 p=vp(vUv); float dist=-p.z; vec3 n=normalize(cross(dFdx(p),dFdy(p)));
          float jit=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
          if(uAO>0. && dist<70.){
            // ambient occlusion + one bounce of nearby colour (screen-space GI)
            float rs=clamp(.55*uP11/dist*.5,3./uRes.y,.09), ang=jit*6.283, ao=0.; vec3 gi=vec3(0.);
            for(int i=0;i<8;i++){ float a=ang+float(i)*2.4, rr=rs*(float(i)+.5)/8.; vec2 u2=vUv+vec2(cos(a)*uRes.y/uRes.x,sin(a))*rr; vec3 v=vp(u2)-p; float dd=dot(v,v), w=max(dot(n,v)*inversesqrt(dd+1e-4)-.15,0.)/(1.+dd*3.); ao+=w; gi+=texture2D(tColor,u2).rgb*w; }
            float fd=smoothstep(70.,40.,dist); float lum=dot(c,vec3(.3,.5,.2));
            c*=mix(1.,clamp(1.-ao/8.*2.2,0.,1.),uAO*fd); c+=gi/8.*.5*fd*clamp(lum*2.,.15,1.);
            // ray-marched contact shadows toward the sun or moon: grounds grass, plants and small props
            if(uRT>0. && dist<48. && dot(n,uLightV)>.03){ float stp=.03+dist*.0045, sh=0.;
              for(int i=1;i<=10;i++){ vec3 s=p+n*(.02+dist*.002)+uLightV*stp*(float(i)-.5+jit); vec2 su=pj(s); if(su.x<0.||su.x>1.||su.y<0.||su.y>1.) break; float df=vp(su).z-s.z; if(df>.03+dist*.003 && df<.6){ sh=1.-float(i)/14.; break; } }
              c*=1.-sh*.42*uShade*smoothstep(48.,30.,dist); }
          }
          { float hz=1.-exp(-dist*uHaze), sd2=max(dot(normalize(p),uSunV),0.); c=mix(c,uSkyC*.92+uSunC*pow(sd2,8.)*.2,hz*.5); }
          // ray-traced reflections on wet ground: monsoon roads, puddles, the tide line
          if(uRT>0. && dist<110.){ vec3 w=(uCamW*vec4(p,1.)).xyz; vec3 nw=normalize(mat3(uCamW)*n);
            float shore=(1.-smoothstep(.15,.95,w.y))*step(-.06,w.y)*.85;
            float pud=smoothstep(.38,.62,texture2D(tNoise,w.xz*.0045).r*.7+texture2D(tNoise,w.xz*.021).g*.3);
            float wet=max(uWet*(.25+.75*pud),shore)*smoothstep(.9,.985,nw.y)*smoothstep(110.,70.,dist);
            if(wet>.02){ vec3 V=normalize(p); vec3 R=reflect(V,normalize(n+vec3(texture2D(tNoise,w.xz*.05).rg-.5,0.)*.04)); float t=.5, pt=0., hit=0.; vec2 hu=vec2(0.);
              for(int i=0;i<14;i++){ vec3 q=p+R*t; vec2 su=pj(q); if(su.x<0.||su.x>1.||su.y<0.||su.y>1.||q.z>-.2) break; float sz=vp(su).z; if(sz>q.z+.1 && sz-q.z<max(2.,t*.4)){ float a=pt,b=t; hu=su; for(int j=0;j<4;j++){ float m=(a+b)*.5; vec3 q2=p+R*m; vec2 s2=pj(q2); if(vp(s2).z>q2.z){ b=m; hu=s2; } else a=m; } hit=1.; break; } pt=t; t=t*1.35+.3; }
              float F=.05+.95*pow(1.-max(dot(-V,n),0.),4.);
              vec3 rc=uSkyC; if(hit>0.){ vec2 f=smoothstep(vec2(0.),vec2(.1),hu)*(1.-smoothstep(vec2(.9),vec2(1.),hu)); rc=mix(uSkyC,texture2D(tColor,hu).rgb,f.x*f.y); }
              c=mix(c*(1.-wet*.25),rc,F*wet); } }
        }
        gl_FragDepthEXT=d; gl_FragColor=vec4(c,1.); }`
    }));
    copy.frustumCulled = false; copy.renderOrder = -100; G.sceneB.add(copy);
    /* water */
    const xs = [-3200, -2200, -1500, -1100, -850], zs = [-3400, -2400, -1700, -1350, -1180];
    for (let x = -700; x <= 720; x += 10) xs.push(x); xs.push(850, 1100, 1600, 2600); for (let z = -1080; z <= 1080; z += 10) zs.push(z); zs.push(1180, 1350, 1700, 2400, 3400);
    const wp = new Float32Array(xs.length * zs.length * 3), wi = []; let k = 0;
    for (let j = 0; j < zs.length; j++) for (let i = 0; i < xs.length; i++) { wp[k++] = xs[i]; wp[k++] = 0; wp[k++] = zs[j]; }
    for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < xs.length - 1; i++) { const a = j * xs.length + i, b = a + 1, c = a + xs.length, d = c + 1; wi.push(a, c, b, b, c, d); }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(wp, 3)); wg.setIndex(wi);
    const watU = G.watU = Object.assign({
      tScene: { value: rtA.texture }, tDepth: { value: rtA.depthTexture }, uRes: { value: new THREE.Vector2() }, uProj: { value: new THREE.Matrix4() }, uNear: { value: .12 }, uFar: { value: 2600 }, uRain: { value: 0 }, uFogD: { value: .002 }, uFogC: { value: new THREE.Color() },
      uAmbCol: { value: new THREE.Color() }, uWaterCol: { value: new THREE.Color(.03, .16, .14) }, uTurb: { value: 1 }, uDay: { value: 1 }
    }, skyU);
    const water = G.water = new THREE.Mesh(wg, new THREE.ShaderMaterial({
      uniforms: watU, fog: false, defines: { SSR_STEPS: Q.ssr },
      vertexShader: COAST + `uniform float uTime; varying vec3 vW,vV;
      void main(){ vec3 p=position; float a=1.-smoothstep(-70.,-5.,p.x-coast(p.z));
        p.y=sin(uTime*.7)*.1+a*.22*sin(p.x*.1+p.z*.03+uTime*.9)+a*.1*sin(p.x*.05-p.z*.11+uTime*.6);
        vW=p; vec4 mv=viewMatrix*vec4(p,1.); vV=mv.xyz; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: SKY + COAST + `
      uniform sampler2D tScene,tDepth; uniform vec2 uRes; uniform mat4 uProj; uniform float uNear,uFar,uRain,uFogD,uTurb,uDay; uniform vec3 uFogC,uAmbCol,uWaterCol;
      varying vec3 vW,vV;
      float lz(float d){ return uNear*uFar/(uFar-d*(uFar-uNear)); }
      float hgt(vec2 p){ float t=uTime; return texture2D(tNoise,p*.0005+t*vec2(.0016,.0009)).r*1.7+texture2D(tNoise,p*.0013-t*vec2(.002,.0012)).g*.8+texture2D(tNoise,p*.0042+t*vec2(.004,-.006)).b*.3+texture2D(tNoise,p*.013-t*vec2(.012,.008)).a*(.09+.2*uRain); }
      void main(){
        vec2 uv=gl_FragCoord.xy/uRes; float wz=-vV.z, sd=lz(texture2D(tDepth,uv).x), dist=length(vV);
        vec3 V=normalize(cameraPosition-vW);
        float e=.45, h0=hgt(vW.xz), hx=hgt(vW.xz+vec2(e,0.)), hz=hgt(vW.xz+vec2(0.,e));
        float dC=vW.x-coast(vW.z);
        float str=(.42+uRain*.3)/(1.+dist*.01);
        vec3 N=normalize(vec3((h0-hx)/e*str,1.,(h0-hz)/e*str));
        // refraction with depth absorption
        vec2 ro=N.xz*.04*clamp((sd-wz)*1.2,0.,1.)/(1.+dist*.03);
        float sd2=lz(texture2D(tDepth,uv+ro).x); vec2 uvr=sd2>wz?uv+ro:uv; float th=max((sd2>wz?sd2:sd)-wz,0.);
        vec3 refr=texture2D(tScene,uvr).rgb;
        float vert=th*max(V.y,.12);
        float ca=texture2D(tNoise,vW.xz*.006+N.xz*.02+uTime*.004).r*texture2D(tNoise,vW.xz*.0075-uTime*.005+.37).g;
        refr*=1.+smoothstep(.2,.5,ca)*1.6*exp(-vert*.9)*uDay*(1.-uCloud*.7);
        vec3 ab=exp(-vert*vec3(.6,.22,.18)*uTurb);
        vec3 col=refr*ab+uWaterCol*uAmbCol*(1.-ab.g);
        // screen-space ray-traced reflection, sky fallback
        vec3 R=reflect(-V,N); R.y=abs(R.y);
        vec3 refl=skyCol(R,0.);
        vec3 Rv=normalize((viewMatrix*vec4(R,0.)).xyz); float t=.6, pt=0.; vec2 huv=vec2(0.); float hit=0.;
        for(int i=0;i<SSR_STEPS;i++){ vec3 p=vV+Rv*t; vec4 c4=uProj*vec4(p,1.); if(c4.w<=0.) break; vec2 su=c4.xy/c4.w*.5+.5; if(su.x<0.||su.x>1.||su.y<0.||su.y>1.) break;
          float d=lz(texture2D(tDepth,su).x), pd=-p.z;
          if(pd>d+.08 && pd-d<max(2.,t*.4)){ float a=pt,b=t; huv=su; for(int j=0;j<5;j++){ float m=(a+b)*.5; vec3 q=vV+Rv*m; vec4 c5=uProj*vec4(q,1.); vec2 s2=c5.xy/c5.w*.5+.5; if(-q.z>lz(texture2D(tDepth,s2).x)){ b=m; huv=s2; } else a=m; } hit=1.; break; }
          pt=t; t=t*1.28+.25; }
        if(hit>0.){ vec2 f=smoothstep(vec2(0.),vec2(.1),huv)*(1.-smoothstep(vec2(.9),vec2(1.),huv)); refl=mix(refl,texture2D(tScene,huv).rgb,f.x*f.y); }
        float F=.02+.98*pow(1.-max(dot(N,V),0.),5.);
        col=mix(col,refl,F);
        col+=uSunCol*pow(max(dot(R,uSunDir),0.),320.)*2.2*(1.-uCloud);
        col+=uNight*vec3(.5,.6,.9)*pow(max(dot(R,uMoonDir),0.),200.)*.5*(1.-uCloud);
        // foam: shoreline (depth) + breaking surf bands
        float fn=texture2D(tNoise,vW.xz*.02+uTime*vec2(.012,.007)).r, fn2=texture2D(tNoise,vW.xz*.004-uTime*.004).g;
        float shore=1.-smoothstep(0.,.22+.4*fn2,vert+(fn-.5)*.18);
        float band=smoothstep(.7,1.,sin(dC*.21+uTime*1.15+fn2*5.))*smoothstep(-60.,-10.,dC)*(1.-smoothstep(-2.,5.,dC))*smoothstep(.3,.62,fn+fn2*.35);
        float foam=clamp(shore*.92+band*.85,0.,1.);
        col=mix(col,uAmbCol*.85,foam);
        float fg=1.-exp(-uFogD*uFogD*dist*dist); col=mix(col,uFogC,fg);
        gl_FragColor=vec4(col,1.);
      }`
    }));
    water.frustumCulled = false; water.renderOrder = -50; G.sceneB.add(water);
    /* rain */
    const RN = 3600, rp = new Float32Array(RN * 6), re = new Float32Array(RN * 2);
    for (let i = 0; i < RN; i++) { const x = Math.random() * 40, y = Math.random() * 40, z = Math.random() * 40; rp.set([x, y, z, x, y, z], i * 6); re[i * 2 + 1] = 1; }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); rg.setAttribute('aEnd', new THREE.BufferAttribute(re, 1));
    const rainU = G.rainU = { uCam: { value: new V3() }, uTime: { value: 0 }, uA: { value: 0 }, uVel: { value: new V3(3, -22, 1) } };
    const rain = G.rainMesh = new THREE.LineSegments(rg, new THREE.ShaderMaterial({
      uniforms: rainU, transparent: true, depthWrite: false, fog: false,
      vertexShader: 'uniform vec3 uCam,uVel; uniform float uTime; attribute float aEnd; void main(){ vec3 p=position+uVel*uTime; p=mod(p-uCam+20.,40.)-20.+uCam; p-=normalize(uVel)*aEnd*.8; gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); }',
      fragmentShader: 'uniform float uA; void main(){ gl_FragColor=vec4(.75,.8,.9,uA); }'
    }));
    rain.frustumCulled = false; rain.visible = false; G.sceneB.add(rain);
    /* lighthouse beam */
    const bg = new THREE.CylinderGeometry(.5, 10, 170, 14, 1, true); bg.translate(0, -85, 0); bg.rotateZ(Math.PI / 2 + .05);
    const beam = G.beam = new THREE.Group(), bm = new THREE.MeshBasicMaterial({ color: new THREE.Color(.5, .46, .32), transparent: true, opacity: .08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const b1 = new THREE.Mesh(bg, bm), b2 = new THREE.Mesh(bg, bm); b2.rotation.y = Math.PI; beam.add(b1, b2); beam.visible = false; G.sceneB.add(beam); G.beamMat = bm;
    /* final post */
    const postU = G.postU = { uBody: { value: 0 }, uLens: { value: 0 }, uRt: { value: new THREE.Vector2(640, 480) }, uGlow: { value: 1 }, uPS2: { value: 0 }, tColor: { value: rtB.texture }, tDepth: { value: rtA.depthTexture }, uSunUv: { value: new THREE.Vector2() }, uRays: { value: 0 }, uRayCol: { value: new THREE.Color() }, uExposure: { value: 1 }, uTime: { value: 0 }, uSat: { value: 1 }, uFlash: { value: 0 }, uTint: { value: new THREE.Color(1, 1, 1) } };
    const post = new THREE.Mesh(quadG, new THREE.ShaderMaterial({
      uniforms: postU, depthTest: false, depthWrite: false, fog: false, vertexShader: FSV,
      fragmentShader: `uniform vec2 uRt; uniform float uGlow,uPS2; uniform sampler2D tColor,tDepth; uniform vec2 uSunUv; uniform float uRays,uExposure,uTime,uSat,uFlash; uniform vec3 uRayCol,uTint; varying vec2 vUv; vec2 UV; uniform float uBody,uLens;
      float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
      void main(){ UV=vUv; vec2 cc=vUv-.5; float r2=dot(cc,cc);
        if(uBody>.5) UV=.5+cc*(1.+.26*r2+.3*r2*r2)*.88;
        if(uLens>.01){ vec2 g=vUv*vec2(10.,6.); vec2 id=floor(g); float rn=h(id+3.); vec2 f=fract(g)-.5-(vec2(h(id+7.),h(id+13.))-.5)*.5; float life=fract(uTime*.1*(.5+rn)+rn*7.); f.y+=life*.3*rn; float rad=.2*(.4+.6*rn)*(1.-life*.4); UV+=f*smoothstep(rad,rad*.5,length(f))*step(1.-uLens*.7,rn)*.14; }
        vec3 c=texture2D(tColor,UV).rgb;
        if(uPS2<.5){ vec2 px=1./uRt; vec3 a=texture2D(tColor,UV+vec2(-px.x,-px.y)).rgb, b=texture2D(tColor,UV+vec2(px.x,-px.y)).rgb, e=texture2D(tColor,UV+vec2(-px.x,px.y)).rgb, f=texture2D(tColor,UV+px).rgb; vec3 W=vec3(.299,.587,.114);
          float la=dot(a/(1.+a),W), lb=dot(b/(1.+b),W), le=dot(e/(1.+e),W), lf=dot(f/(1.+f),W), lm=dot(c/(1.+c),W), mn=min(lm,min(min(la,lb),min(le,lf))), mx=max(lm,max(max(la,lb),max(le,lf)));
          vec2 dir=vec2(-((la+lb)-(le+lf)),(la+le)-(lb+lf)); float rm=1./(min(abs(dir.x),abs(dir.y))+max((la+lb+le+lf)*.03125,.0078)); dir=clamp(dir*rm,-8.,8.)*px;
          vec3 r1=.5*(texture2D(tColor,UV+dir*(1./3.-.5)).rgb+texture2D(tColor,UV+dir*(2./3.-.5)).rgb), r2=r1*.5+.25*(texture2D(tColor,UV-dir*.5).rgb+texture2D(tColor,UV+dir*.5).rgb); float l2=dot(r2/(1.+r2),W); c=(l2<mn||l2>mx)?r1:r2; }
        if(uBody>.5){ vec2 ca=cc*r2*.05; c.r=texture2D(tColor,UV+ca).r; c.b=texture2D(tColor,UV-ca).b; }
        if(uRays>.002){ vec2 dl=(uSunUv-UV)/20.; vec2 uv=UV+dl*h(gl_FragCoord.xy); float acc=0.;
          for(int i=0;i<20;i++){ acc+=step(.99995,texture2D(tDepth,uv).x)*(1.-float(i)/20.); uv+=dl; }
          c+=uRayCol*acc/20.*uRays*(1.-smoothstep(0.,1.15,distance(UV,uSunUv))); }
        { vec3 g=vec3(0.); vec2 px=1./uRt; for(int i=0;i<8;i++){ float a=float(i)*.785+.4; vec2 o=vec2(cos(a),sin(a))*px*(mod(float(i),2.)<.5?2.5:6.); g+=max(texture2D(tColor,UV+o).rgb-.85,0.); } c+=g*.11*uGlow; }
        c+=uFlash*vec3(.5,.55,.7);
        c*=uExposure; c=clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.); c=pow(c,vec3(1./2.2));
        float l=dot(c,vec3(.299,.587,.114)); c=mix(vec3(l),c,uSat*.9)*uTint; c=c*vec3(1.03,1.,.94)*.97+vec3(.012,.014,.02);
        if(uBody>.5){ c*=1.-smoothstep(.15,.5,r2)*.85; c=mix(vec3(dot(c,vec3(.3,.59,.11))),c,.86)*vec3(1.03,1.,.95); if(UV.x<0.||UV.x>1.||UV.y<0.||UV.y>1.) c=vec3(0.); }
        if(uPS2>.5){ vec2 pc=floor(UV*uRt); float by=mod(pc.x+pc.y*2.,4.)/4.+mod(floor(pc.x*.5)+floor(pc.y*.5)*2.,4.)/16.; c=floor(c*40.+by)/40.; } else c+=(h(gl_FragCoord.xy+fract(uTime)*91.)-.5)*.012;
        gl_FragColor=vec4(c,1.); }`
    }));
    post.frustumCulled = false; scenePost.add(post);

    const resize = G.resize = () => {
      const w0 = innerWidth, h0 = innerHeight, dpr = clamp(G.Q().h / h0, 1, window.devicePixelRatio || 1), w = Math.round(w0 * dpr), h = Math.round(h0 * dpr), rh = Math.min(h, G.Q().h), rw = Math.max(320, Math.round(rh * w / h)); G.rtH = rh; postU.uRt.value.set(rw, rh); postU.uPS2.value = G.Q().ps2 ? 1 : 0; postU.uGlow.value = G.Q().ps2 ? 1 : .45;
      r.setSize(w, h, false); el.style.width = w0 + 'px'; el.style.height = h0 + 'px';
      rtA.setSize(rw, rh); rtB.setSize(rw, rh);
      cam.aspect = G.camVM.aspect = w / h; cam.updateProjectionMatrix(); G.camVM.updateProjectionMatrix();
      copyU.uRes.value.set(rw, rh); watU.uRes.value.set(rw, rh);
    };
    addEventListener('resize', resize); resize();

    const tmp = new V3(), fwd = new V3(), cZen = new THREE.Color(), cHor = new THREE.Color(), c1 = new THREE.Color(), c2 = new THREE.Color();
    const C = (r, g, b) => new THREE.Color(r, g, b), zenD = C(.075, .2, .52), horD = C(.46, .62, .82), zenS = C(.10, .11, .27), horS = C(.62, .40, .27), zenN = C(.0035, .007, .018), horN = C(.009, .016, .03), grey = C(.36, .39, .43), warm = C(1, .34, .07), white = C(1, .93, .82);
    G.updateEnv = dt => {
      env.hour += dt / env.HOUR; if (env.hour >= 24) { env.hour -= 24; env.day++; if (G.onNewDay) G.onNewDay(); }
      // weather
      env.wNext -= dt / env.HOUR; if (env.wNext <= 0) { env.wNext = 2 + Math.random() * 4; const t = Math.random(); if (t < .26) { env.tCloud = .15 + Math.random() * .2; env.tRain = 0; } else if (t < .46) { env.tCloud = .6; env.tRain = 0; } else if (t < .8) { env.tCloud = .9; env.tRain = .65; } else { env.tCloud = 1; env.tRain = 1; } }
      env.cloud += clamp(env.tCloud - env.cloud, -dt * .012, dt * .012); const rt = env.cloud > .7 ? env.tRain : 0; env.rain += clamp(rt - env.rain, -dt * .03, dt * .03);
      env.wet += clamp((env.rain > .1 ? 1 : 0) - env.wet, -dt * .008, dt * .05);
      const a = (env.hour - 6) / 12 * Math.PI, am = (env.hour - 18) / 12 * Math.PI;
      env.sunDir.set(Math.cos(a), Math.sin(a), .3).normalize(); env.moonDir.set(Math.cos(am) * .9, Math.sin(am), -.35).normalize();
      const el2 = env.sunDir.y, dayF = env.dayF = sm(-.1, .1, el2), up = sm(0, .38, el2), oc = Math.pow(env.cloud, 1.5) * .85;
      env.night = 1 - sm(-.22, -.02, el2);
      cZen.copy(zenS).lerp(zenD, up); cHor.copy(horS).lerp(horD, up); cZen.lerp(zenN, 1 - dayF); cHor.lerp(horN, 1 - dayF);
      const lum = cHor.r * .3 + cHor.g * .5 + cHor.b * .2; c1.copy(grey).multiplyScalar(lum * 1.5); cZen.lerp(c2.copy(c1).multiplyScalar(.6), oc); cHor.lerp(c1, oc);
      skyU.uZen.value.copy(cZen); skyU.uHor.value.copy(cHor);
      const sInt = 2.7 * sm(-.03, .12, el2) * (1 - oc * .8);
      skyU.uSunCol.value.copy(warm).lerp(white, sm(.02, .34, el2)).multiplyScalar(sInt);
      skyU.uCloud.value = env.cloud; skyU.uNight.value = env.night; skyU.uTime.value = G.t;
      // direct light: sun by day, moon by night
      if (el2 > -.03) { env.lightDir.copy(env.sunDir); sun.color.copy(skyU.uSunCol.value); sun.intensity = 1; }
      else { env.lightDir.copy(env.moonDir.y > .05 ? env.moonDir : tmp.set(.3, .8, .2).normalize()); sun.color.setRGB(.42, .52, .85); sun.intensity = .52 * sm(.03, .3, env.moonDir.y) * (1 - env.cloud * .7) * env.night + .02; }
      if (env.lightDir.y < .12) { env.lightDir.y = .12; env.lightDir.normalize(); }
      hemi.color.copy(cZen).multiplyScalar(1.1).add(c1.copy(cHor).multiplyScalar(.5)); hemi.color.r += .012 + env.night * .012; hemi.color.g += .017 + env.night * .02; hemi.color.b += .032 + env.night * .045;
      hemi.groundColor.setRGB(.28, .22, .16).multiplyScalar(lum * 1.2 + .01); hemi.intensity = 1 + env.flash * 6;
      scene.fog.color.copy(cHor).multiplyScalar(.82).lerp(cZen, .15); scene.fog.density = .0017 + env.rain * .0055 + env.cloud * .0008 + env.night * .0012 + sm(7.5, 5.5, env.hour) * sm(4, 5.5, env.hour) * .004;
      env.amb = clamp(dayF * (.95 - oc * .4) + .1 + env.flash, .1, 1.3);
      // lightning
      if (env.rain > .85) { env.flashT -= dt; if (env.flashT <= 0) { env.flashT = 6 + Math.random() * 16; env.flash = 1; if (G.Audio) G.Audio.thunder(); } }
      env.flash = Math.max(0, env.flash - dt * (env.flash > .6 ? 9 : 2.5)); if (env.flash > .3 && env.flash < .5 && Math.random() < .15) env.flash = .9;
      G.mats.glow.emissiveIntensity = .15 + env.night * 3.4; G.lampGlow.material.opacity = env.night * .9; G.lampGlow.visible = env.night > .05;
      lampT -= dt; if (lampT <= 0) { lampT = .35; const cp = cam.position, L = G.lamps, best = [-1, -1, -1], bd = [3600, 3600, 3600]; if (env.night > .1) for (let i = 0; i < L.length; i++) { const d = sq(L[i][0] - cp.x) + sq(L[i][2] - cp.z); for (let k = 0; k < 3; k++) if (d < bd[k]) { for (let j = 2; j > k; j--) { bd[j] = bd[j - 1]; best[j] = best[j - 1]; } bd[k] = d; best[k] = i; break; } } G.lampLights.forEach((p, k) => { if (best[k] >= 0) { const l = L[best[k]]; p.position.set(l[0], l[1] - .4, l[2]); p.userData.t = 1.5; } else p.userData.t = 0; }); }
      for (const p of G.lampLights) p.intensity += ((p.userData.t || 0) * env.night - p.intensity) * Math.min(1, dt * 4);
      postU.uTint.value.setRGB(1 - env.night * .12, 1 - env.night * .04, 1 + env.night * .1);
      G.terrU.uWet.value = env.wet; G.windU.uTime.value = G.t; G.windU.uWind.value = (.45 + env.cloud * .5 + env.rain * .9) * (1 + .45 * Math.sin(G.t * .37) * Math.sin(G.t * .13 + 1));
      rain.visible = env.rain > .02; rainU.uA.value = env.rain * .42 * (.4 + env.amb * .55); rainU.uTime.value = G.t;
      for (const p of G.plights) if (p.intensity > 0) { p.userData.life -= dt; p.intensity = Math.max(0, p.intensity - dt * p.userData.decay); }
      beam.visible = !!(G.S && G.S.lightOn) && env.night > .1; if (beam.visible) { beam.position.set(G.poi.lightTop.x, G.poi.lightTop.y, G.poi.lightTop.z); beam.rotation.y = G.t * .5; bm.opacity = .08 * env.night; }
    };
    G.addLight = (x, y, z, hex, intensity, decay, dist) => { let b = G.plights[0]; for (const p of G.plights) if (p.intensity < b.intensity) b = p; b.position.set(x, y, z); b.color.set(hex); b.intensity = intensity; b.distance = dist || 22; b.userData.decay = decay || intensity * 12; };

    G.render = () => {
      const Q = G.Q();
      sky.position.copy(cam.position);
      if ((G.frame & 7) === 0 || !G.started) G.updateVeg(cam.position);
      // shadow frustum follows the camera, snapped to texels
      const tx = 116 / Q.shadow; sun.target.position.set(Math.round(cam.position.x / tx) * tx, Math.round(cam.position.y / 2) * 2 - 1, Math.round(cam.position.z / tx) * tx);
      sun.position.copy(sun.target.position).addScaledVector(env.lightDir, 240);
      cam.updateMatrixWorld();
      r.setRenderTarget(rtA); r.clear(); r.render(scene, cam);
      copyU.uPI.value.copy(cam.projectionMatrixInverse); copyU.uP11.value = cam.projectionMatrix.elements[5]; copyU.uAO.value = Q.ao; copyU.uPM.value.copy(cam.projectionMatrix); copyU.uCamW.value.copy(cam.matrixWorld); copyU.uLightV.value.copy(env.lightDir).transformDirection(cam.matrixWorldInverse); copyU.uShade.value = clamp(sun.intensity * (sun.color.r + sun.color.g + sun.color.b) * .5, 0, 1) * (1 - env.cloud * .6); copyU.uWet.value = env.wet; copyU.uRT.value = Q.ps2 ? 0 : 1; copyU.uSkyC.value.copy(skyU.uHor.value).lerp(skyU.uZen.value, .22); copyU.uSunV.value.copy(env.sunDir).transformDirection(cam.matrixWorldInverse); copyU.uSunC.value.copy(skyU.uSunCol.value); copyU.uHaze.value = .0022 + env.rain * .004 + env.night * .0005;
      watU.uProj.value.copy(cam.projectionMatrix); watU.uRain.value = env.rain; watU.uFogD.value = scene.fog.density; watU.uFogC.value.copy(scene.fog.color);
      watU.uAmbCol.value.copy(hemi.color).multiplyScalar(.9).add(c1.copy(sun.color).multiplyScalar(sun.intensity * .22)); watU.uTurb.value = 1 + env.wet * .8; watU.uDay.value = env.dayF;
      watU.uWaterCol.value.setRGB(.03 + env.wet * .05, .16, .14 - env.wet * .04);
      rainU.uCam.value.copy(cam.position);
      r.setRenderTarget(rtB); r.clear(true, true, false); r.render(G.sceneB, cam);
      // light shafts
      cam.getWorldDirection(fwd); const sd = fwd.dot(env.sunDir); tmp.copy(cam.position).addScaledVector(env.sunDir, 1000).project(cam);
      postU.uSunUv.value.set(tmp.x * .5 + .5, tmp.y * .5 + .5); postU.uRays.value = Q.rays * sm(.0, .5, sd) * env.dayF * (1 - env.cloud * .75) * .55; postU.uRayCol.value.copy(skyU.uSunCol.value).multiplyScalar(.28);
      postU.uExposure.value = lerp(.56, 1.7, env.night) * (1 + env.cloud * .15 * env.dayF); postU.uTime.value = G.t; postU.uFlash.value = env.flash * .25;
      { const P0 = G.P, body = G.started && P0 && !P0.tps && !P0.veh && P0.alive && G.set.body !== 0 ? 1 : 0; postU.uBody.value = body; postU.uLens.value = env.rain * (body ? .9 : .4); }
      r.setRenderTarget(null); r.render(scenePost, ortho);
      // first-person viewmodel on top, own depth range
      const a = clamp(env.amb, .12, 1); G.vmAmb.intensity = .22 + .5 * a; G.vmDir.intensity = .25 + .85 * a * (1 - env.cloud * .4); G.vmDir.color.copy(skyU.uSunCol.value).multiplyScalar(.2).addScalar(.55); if (G.flash.intensity > 0) G.vmAmb.intensity += .15;
      r.clearDepth(); r.render(G.sceneVM, G.camVM);
    };
  };
})();
