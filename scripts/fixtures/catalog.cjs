// Synthetic, independent samples: editing the published inventory cannot break behavior checks.
const people = Array.from({length:100}, (_,index) => ({id:'p'+String(index+1).padStart(4,'0'),name:'样本人'+(index+1),aliases:[],nameSource:'https://example.test/name',portrait:{source:{provider:'Fixture',url:'https://example.test/photo',retrieved:'2026-01-01'}}}));
for(const id of ['p0107','p0122','p0124','p0176']) people.push({id,name:'样本人'+id,aliases:[],nameSource:'https://example.test/name',portrait:{source:{provider:'Fixture',url:'https://example.test/photo',retrieved:'2026-01-01'}}});
const named = [
 ['p0054','河北彩花','河北彩伽','Kawakita Saika'],['p0041','樱空桃','桜空もも','Sakura Momo'],['p0058','枫花恋','楓カレン','Kaede Karen'],['p0043','美谷朱里','美谷朱音','Mitani Akari'],['p0083','葵伊吹','葵いぶき','Aoi Ibuki'],['p0122','未步奈奈','未歩なな','Miho Nana'],['p0107','翼舞','つばさ舞','Tsubasa Mai'],['p0032','三上悠亚','三上悠亜','Mikami Yua'],['p0066','水城弥生','水城弥生','Mizuki Yayoi'],['p0001','筱田优','篠田ゆう','Shinoda Yuu'],['p0015','春菜花','春菜はな','Haruna Hana'],['p0031','美咲佳奈','美咲かんな','Misaki Kanna'],['p0055','水川堇','水川スミレ','Mizukawa Sumire'],['p0176','黑木香','黒木香','Kuroki Kaoru']
];
for(const [id,name,japaneseName,romanization] of named) Object.assign(people.find(p=>p.id===id),{name,japaneseName,romanization});
const evidence = {sourceName:'样本人',source:{url:'https://example.test/profile'},reviewed:'2026-01-01'};
people.find(p=>p.id==='p0054').profile={...evidence,heightCm:169};
people.find(p=>p.id==='p0100').profile={...evidence,birthYear:2000};
people.find(p=>p.id==='p0067').profile={...evidence,debutYear:2019};
people.find(p=>p.id==='p0005').profile={...evidence,birthYear:1980,fieldSources:{birthYear:[evidence,{...evidence,source:{url:'https://example.test/second'}}]}};
for(const id of ['p0004','p0032']) people.find(p=>p.id===id).hallOfFame={reason:'受控入选依据',sources:['https://example.test/hall']};
people.find(p=>p.id==='p0029').portrait.source.license={author:'样本作者',name:'CC BY 3.0',url:'https://creativecommons.org/licenses/by/3.0/'};
const rankings = [2023,2024,2025].map(year=>{
 const rankingPeople=people.filter(p=>p.id!=='p0004'&&(year!==2025||p.id!=='p0032')).slice(0,100);
 const ordered=rankingPeople.filter(p=>p.id!=='p0054');ordered.splice(year===2024?2:3,0,people.find(p=>p.id==='p0054'));
 return {year,entries:ordered.map((p,index)=>({person:p.id,rank:index+1})),source:{url:'https://example.test/ranking'}};
});
const photo = person => ({path:'actresses/portraits/'+person.id+'.png',person:person.id,kind:'actress',title:person.name,width:512,height:512,sha:'a'.repeat(40),thumbnail:'app/previews/'+person.id+'-0123456789.webp'});
const ordinary = [
 {path:'wallpapers/anime/1440x3120/phone.png',kind:'wallpaper',title:'雨夜少女',device:'phone',width:1440,height:3120},
 {path:'wallpapers/anime/1440x3120/phone-two.png',kind:'wallpaper',title:'另一少女',device:'phone',width:1440,height:3120},
 {path:'wallpapers/landscape/1920x1080/mount-fuji.png',kind:'wallpaper',title:'受控桌面壁纸',device:'desktop',width:1920,height:1080},
 {path:'avatars/anime/512x512/avatar.png',kind:'avatar',title:'受控头像',width:512,height:512},
 {path:'icons/ai/sample.png',kind:'icon',title:'Claude 样本',width:512,height:512},
 {path:'icons/network/sample.png',kind:'icon',title:'网络样本',width:512,height:512},
 {path:'bank-cards/originals/hong-kong/hsbc/card.png',kind:'bank-card',title:'受控卡面',width:512,height:320},
 {path:'bank-cards/originals/hong-kong/hsbc/card-two.png',kind:'bank-card',title:'另一卡面',width:600,height:380},
 {path:'bank-cards/originals/singapore/dbs/card.png',kind:'bank-card',title:'DBS',width:512,height:320},
 {path:'bank-cards/originals/singapore/ocbc/card.png',kind:'bank-card',title:'OCBC',width:512,height:320},
 ...['first','second','third'].map(id=>({path:'game-covers/sample/'+id+'.jpg',kind:'game-cover',title:'受控游戏',width:512,height:768}))
].map(item=>({...item,sha:'a'.repeat(40)}));
const catalog={version:1,assets:[...ordinary,...people.map(photo)],cardBanks:[{region:'hong-kong',bank:'hsbc',name:'HSBC',englishName:'HSBC'},{region:'singapore',bank:'dbs',name:'DBS',englishName:'DBS Singapore'},{region:'singapore',bank:'ocbc',name:'OCBC',englishName:'OCBC Singapore'}],gameSeries:[{id:'sample',title:'逆转裁判样本系列'}],games:['first','second','third'].map((id,i)=>({id,series:'sample',title:'受控游戏'+i,firstReleaseYear:2000+i,synopsis:{text:'独立剧情样本',source:'https://example.test/story'}})),actresses:{people,rankings,redirects:{},series:{title:'样本年度榜',method:'受控测试数据'}}};
module.exports=()=>structuredClone(catalog);
