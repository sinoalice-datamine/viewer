let db = {
	json: new Map(),
	index: {
		characters: null,
		cards: null,
		skills: null,
	},
};

const cardType_weapon = 1;
const cardType_armor = 2;
const cardType_nightmare = 3;
const cardType_upgradeExp = 5; // upgrade sword/shield/tablet
const cardType_gold = 6;
const cardType_skillExp = 7; // gem (story, story support, colo, colo support)

const rarityMap = ["D", "C", "B", "A", "S", "SR", "L", "LL"];

function viewClasses(db, character_mst_list, character_ability_mst_list, isDebug) {
	db.index.characters = new Map();

	let characters = db.index.characters;

	// Build indices.
	for (let i = 0; i < character_mst_list.length; i++) {
		let character_mst = character_mst_list[i];
		characters.set(character_mst.characterMstId, {
			mst: character_mst,
			skills: [],
		});
	}

	for (let i = 0; i < character_ability_mst_list.length; i++) {
		let character_ability_mst = character_ability_mst_list[i];
		let c = characters.get(character_ability_mst.characterMstId);
		c.skills.push(character_ability_mst);
	}

	let totalStats = [0, 0, 0, 0, 0, 0, 0];
	const skillType_names = ["", "Common", "Class", "Support", "Support"];

	let heading = "<h1>Units (character/class)</h1>";

	let unitSections = ""
	for (const [k, v] of characters) {
		unitSections += `<section id="${v.mst.characterMstId}"><h2>${v.mst.name}</h2>`;
		if (v.mst.displayStartTime) {
			const date = new Date(v.mst.displayStartTime * 1000);
			unitSections += `<p>Display start time: ${date.toISOString()}</p>`;
		}

		// 1: hp, 2: patk, 3: pdef, 4: matk, 5: mdef, 6: weapon, 7: cost
		let stats = {
			base:    [0, 0, 0, 0, 0, 0, 0],
			arcana1: [0, 0, 0, 0, 0, 0, 0],
			arcana2: [0, 0, 0, 0, 0, 0, 0],
			arcana3: [0, 0, 0, 0, 0, 0, 0],
			arcana4: [0, 0, 0, 0, 0, 0, 0],
			arcana5: [0, 0, 0, 0, 0, 0, 0],
		};

		unitSections += '<table><thead><tr>';
		if (isDebug) {
			unitSections += '<th>id</th>';
			unitSections += '<th>releaseLevel</th>';
			unitSections += '<th>skillType_name</th>';
			unitSections += '<th>name</th>';
			unitSections += '<th>skillType</th>';
			unitSections += '<th>effectType</th>';
			unitSections += '<th>effectValue</th>';
			unitSections += '<th>cardDetailType</th>';
		} else {
			unitSections += '<th>level</th>';
			unitSections += '<th>type</th>';
			unitSections += '<th>effect</th>';
		}
		unitSections += '</tr></thead><tbody>';
		for (let i = 0; i < v.skills.length; i++) {
			let skill = v.skills[i];
			unitSections += '<tr>';
			if (isDebug) {
				unitSections += `<td>${skill.characterAbilityMstId}</td>`;
			}
			unitSections += `<td>${skill.releaseLevel}</td>`;
			unitSections += `<td>${skillType_names[skill.skillType]}</td>`;
			unitSections += `<td>${skill.name}</td>`;
			if (isDebug) {
				unitSections += `<td>${skill.skillType}</td>`;
				unitSections += `<td>${skill.effectType}</td>`;
				unitSections += `<td>${skill.effectValue}</td>`;
				unitSections += `<td>${skill.cardDetailType}</td>`;
			}
			unitSections += '</tr>';
			if (skill.skillType == 1 || skill.skillType == 2) {
				let unlock = null;
				if (skill.releaseLevel <= 10) {
					unlock = stats.base
				} else if (skill.releaseLevel <= 12) {
					unlock = stats.arcana1;
				} else if (skill.releaseLevel <= 14) {
					unlock = stats.arcana2;
				} else if (skill.releaseLevel <= 16) {
					unlock = stats.arcana3;
				} else if (skill.releaseLevel <= 18) {
					unlock = stats.arcana4;
				} else {
					unlock = stats.arcana5;
				}
				unlock[skill.effectType - 1] += skill.effectValue;
				totalStats[skill.effectType - 1] += skill.effectValue;
			}
		}
		unitSections += '</tbody></table>';

		unitSections += '<table><thead><tr>';
		unitSections += '<th>unlock</th>';
		unitSections += '<th>HP</th>';
		unitSections += '<th>patk</th>';
		unitSections += '<th>pdef</th>';
		unitSections += '<th>matk</th>';
		unitSections += '<th>mdef</th>';
		unitSections += '<th>cost</th>';
		unitSections += '</tr></thead><tbody>';

		for (let k in stats) {
			let unlock = stats[k];
			unitSections += '<tr>';
			unitSections += `<td>${k}</td>`;
			for (let i = 0; i < unlock.length; i++) {
				if (i == 5) continue;
				if (unlock[i] != 0) {
					unitSections += `<td>${unlock[i]}</td>`;
				} else {
					unitSections += '<td></td>';
				}
			}
			unitSections += '</tr>';
		}
		unitSections += '</tbody></table>';

		unitSections += '</section>';
	}

	let totalStatsSection = "";
	totalStatsSection += '<section><h2>Total stats</h2><ul>';
	totalStatsSection += `<li>Number of units: ${characters.size}</li>`;
	totalStatsSection += `<li>HP: ${totalStats[0]}</li>`;
	totalStatsSection += `<li>patk: ${totalStats[1]}</li>`;
	totalStatsSection += `<li>pdef: ${totalStats[2]}</li>`;
	totalStatsSection += `<li>matk: ${totalStats[3]}</li>`;
	totalStatsSection += `<li>mdef: ${totalStats[4]}</li>`;
	totalStatsSection += `<li>cost: ${totalStats[6]}</li>`;
	totalStatsSection += '</ul></section>';

	let content = document.getElementById("content");
	content.innerHTML = heading + totalStatsSection + unitSections;

	return "Datamine viewer - units";
}

function getMultiplierText(mult, multName) {
	let res = "";
	if (!mult)
		return res;

	if (mult.base && mult.base[multName]) {
		res += mult.base[multName];
	}

	if (mult.alt && mult.alt[multName]) {
		res += `(${mult.alt[multName]})`;
	}

	return res;
}

function viewWeapons(version, db, card_mst_list, skill_mst_list, skill_multipliers_blue, isDebug) {
	db.index.cards = {};
	db.index.skills = {};

	let cards = db.index.cards;
	for (let i = 0; i < card_mst_list.length; i++) {
		let card_mst = card_mst_list[i];

		if (card_mst.cardType != cardType_weapon)
			continue;

		if (!isDebug && !card_mst.isRelease)
			continue;

		let card = cards[card_mst.name];
		if (!card) {
			card = {
				name: card_mst.name,
				variants: [],
			};
			cards[card_mst.name] = card;
		}
		card.variants.push(card_mst);
	}

	let skills = db.index.skills;
	for (let i = 0; i < skill_mst_list.length; i++) {
		let skill_mst = skill_mst_list[i];
		skills[skill_mst.skillMstId] = skill_mst;
	}
	for (let i = 0; i < skill_multipliers_blue.length; i++) {
		let mult = skill_multipliers_blue[i];
		let skill = skills[mult.skillMstId];
		skill.mult = mult;

		// TODO: Support JP skills.
		if (version == "EN") {
			if (skill.rangeIcon == 1) {
				skill.mult.base.targetsMin = 1;
				skill.mult.base.targetsMax = 1;
			} else if (skill.rangeIcon == 3) {
				const regex = /(\d) (?:ally|allies|enemies)/;
				let match = regex.exec(skill.description);
				let targetCount = match[1]|0;
				skill.mult.base.targetsMin = targetCount;
				skill.mult.base.targetsMax = targetCount;
			} else if (skill.rangeIcon == 2) {
				const regex = /(\d) (?:to|or) (\d)/;
				let match = regex.exec(skill.description);
				skill.mult.base.targetsMin = match[1]|0;
				skill.mult.base.targetsMax = match[2]|0;
			}
		}
	}

	let cardList = [];
	for (let k in cards) {
		let card = cards[k];
		card.variants.sort(function(a, b) {
			if (a.evolutionLevel != b.evolutionLevel)
				return a.evolutionLevel - b.evolutionLevel;

			return a.cardMstId - b.cardMstId;
		});
		cardList.push(card);
	}

	cardList.sort(function(a, b) {
		let variantA = a.variants[a.variants.length - 1];
		let variantB = b.variants[b.variants.length - 1];
		if (variantA.isInfiniteEvolution) {
			if (variantB.isInfiniteEvolution)
				return variantA.name.localeCompare(variantB.name);
			else
				return -1;
		} else if (variantB.isInfiniteEvolution) {
			return 1;
		} else {
			let skillA = skills[variantA.frontSkillMstId];
			let skillB = skills[variantB.frontSkillMstId];
			let nameOrder = skillA.name.localeCompare(skillB.name);
			if (nameOrder != 0)
				return nameOrder;

			return variantA.frontSkillMstId - variantB.frontSkillMstId;
		}
	});

	let html = "<h1>Weapons</h1>";
	html += '<table class="fixedHeader"><thead><tr>';
	if (isDebug) {
		html += '<th>cardMstId</th>';
	}
	html += '<th>name</th>';
	html += '<th>rarity</th>';
	if (isDebug) {
		html += '<th>isRelease</th>';
		html += '<th>roleType</th>';
		html += '<th>cardType</th>';
		html += '<th>cardDetailType</th>';
		html += '<th>weaponType</th>';
		html += '<th>attribute</th>';
	}
	if (isDebug) {
		html += '<th>autoSkillMstId</th>';
	}
	html += '<th>Colosseum Support</th>';
	if (isDebug) {
		html += '<th>frontSkillMstId</th>';
	}
	html += '<th>Colosseum</th>';
	html += '<th>SP</th>'
	html += '<th>targets</th>';
	html += '<th>damage</th>'
	html += '<th>recovery</th>'
	html += '<th>patk</th>'
	html += '<th>matk</th>'
	html += '<th>pdef</th>'
	html += '<th>mdef</th>'
	if (isDebug) {
		html += '<th>questSkillMstId</th>';
		html += '<th>limitBreakSkillMstId</th>';
	}
	html += '</tr></thead><tbody>';

	for (let c = 0; c < cardList.length; c++) {
		let card = cardList[c];
		for (let i = 0; i < card.variants.length; i++) {
			let variant = card.variants[i];

			html += '<tr>';

			if (isDebug) {
				html += `<td>${variant.cardMstId}</td>`;
			}

			// name
			if (i == 0) {
				html += `<td rowspan="${card.variants.length}">${variant.name}</td>`;
			}

			// rarity
			html += `<td>${rarityMap[variant.rarity]}`;
			if (variant.isInfiniteEvolution) {
				html += ` (${variant.evolutionLevel}/${card.variants.length - 1})`;
			}
			html += `</td>`

			if (isDebug) {
				html += `<td>${variant.isRelease}</td>`;
				html += `<td>${variant.roleType}</td>`;
				html += `<td>${variant.cardType}</td>`;
				html += `<td>${variant.cardDetailType}</td>`;
				html += `<td>${variant.weaponType}</td>`;
				html += `<td>${variant.attribute}</td>`;
			}

			if (isDebug) {
				html += `<td>${variant.autoSkillMstId}</td>`;
			}
			let autoSkill = skills[variant.autoSkillMstId];
			html += "<td>";
			if (autoSkill)
				html += autoSkill.name;
			else
				html += "undef"
			html += "</td>";

			let frontSkill = skills[variant.frontSkillMstId];
			if (isDebug) {
				let note = (variant.backSkillMstId && variant.frontSkillMstId != variant.backSkillMstId)
					? " different back skill" : "";
				html += `<td>${variant.frontSkillMstId}${note}</td>`;
			}
			if (frontSkill) {
				let targetsText = "";
				if (version == "EN" && frontSkill.mult) {
					let baseTargetsMin = frontSkill.mult.base.targetsMin;
					let baseTargetsMax = frontSkill.mult.base.targetsMax;
					let altTargetsMin = baseTargetsMin;
					let altTargetsMax = baseTargetsMax;
					if (frontSkill.mult.alt) {
						if (frontSkill.mult.alt.targetsMin) {
							altTargetsMin = frontSkill.mult.alt.targetsMin;
						}
						if (frontSkill.mult.alt.targetsMax) {
							altTargetsMax = frontSkill.mult.alt.targetsMax;
						}
					}
					if (baseTargetsMin != baseTargetsMax) {
						targetsText += `${baseTargetsMin}-${baseTargetsMax}`;
					} else {
						targetsText += `${baseTargetsMin}`;
					}
					if (baseTargetsMin != altTargetsMin || baseTargetsMax != altTargetsMax) {
						targetsText += ' (';
						if (altTargetsMin != altTargetsMax) {
							targetsText += `${altTargetsMin}-${altTargetsMax}`;
						} else {
							targetsText += `${altTargetsMin}`;
						}
						targetsText += ')';
					}
				}
				html += `<td>${frontSkill.name}</td>`;
				html += `<td>${frontSkill.sp}</td>`;
				html += `<td>${targetsText}</td>`;
				html += `<td>${getMultiplierText(frontSkill.mult, 'damage')}</td>`;
				html += `<td>${getMultiplierText(frontSkill.mult, 'recovery')}</td>`;
				html += `<td>${getMultiplierText(frontSkill.mult, 'patk')}</td>`;
				html += `<td>${getMultiplierText(frontSkill.mult, 'matk')}</td>`;
				html += `<td>${getMultiplierText(frontSkill.mult, 'pdef')}</td>`;
				html += `<td>${getMultiplierText(frontSkill.mult, 'mdef')}</td>`;
			} else {
				html += `<td colspan="9">undef</td>`;
			}

			if (isDebug) {
				html += `<td>${variant.questSkillMstId}</td>`;
				html += `<td>${variant.limitBreakSkillMstId}</td>`;
			}
			html += '</tr>';
		}
	}
	html += '</tbody></table>';

	let content = document.getElementById("content");
	content.innerHTML = html;

	return "Datamine viewer - weapons";
}

function viewNightmares(card_mst_list, art_mst_list, isDebug) {
	let art_mst_map = {};
	for (let i = 0; i < art_mst_list.length; i++) {
		const art = art_mst_list[i];
		art_mst_map[art.artMstId] = art;
	}

	let html = "<h1>Nightmares</h1>";
	html += '<table class="fixedHeader"><thead><tr>';
	if (isDebug) {
		html += '<th>cardMstId</th>';
	}
	html += '<th>name</th>';
	html += '<th>rarity</th>';
	if (isDebug) {
		html += '<th>questArtMstId</th>';
	}
	html += '<th>Story skill</th>';
	if (isDebug) {
		html += '<th>artMstId</th>';
	}
	html += '<th>Colosseum skill</th>';
	html += '</tr></thead><tbody>';

	for (let i = 0; i < card_mst_list.length; i++) {
		let card = card_mst_list[i];
		if (card.cardType != cardType_nightmare)
			continue;

		if (!isDebug && !card.isRelease)
			continue;

		html += '<tr>';

		if (isDebug) {
			html += `<td>${card.cardMstId}</td>`;
		}

		html += `<td>${card.name}</td>`;
		html += `<td>${rarityMap[card.rarity]}</td>`;

		let storySkill = art_mst_map[card.questArtMstId];
		let coloSkill = art_mst_map[card.artMstId];

		if (isDebug) {
			html += `<td>${card.questArtMstId}</td>`;
		}
		html += `<td>${storySkill ? storySkill.name : "undef"}</td>`;
		if (isDebug) {
			html += `<td>${card.artMstId}</td>`;
		}
		html += `<td>${coloSkill ? coloSkill.name : "undef"}</td>`;

		html += '</tr>';
	}
	html += '</tbody></table>';

	let content = document.getElementById("content");
	content.innerHTML = html;

	return "Datamine viewer - nightmares";
}

function viewSkills(skill_mst_list_en, skill_mst_list_jp, isDebug) {
	let skillMapJp = new Map();
	for (let i = 0; i < skill_mst_list_jp.length; i++) {
		let entry = skill_mst_list_jp[i];
		skillMapJp.set(entry.skillMstId, entry);
	}

	let html = "<h1>Skills</h1>";
	html += '<table class="fixedHeader"><thead><tr>';
	html += '<th>skillMstId</th>';
	html += '<th>name</th>';
	html += '<th>description</th>';
	html += '</tr></thead><tbody>';

	for (let s = 0; s < skill_mst_list_en.length; s++) {
		let skill = skill_mst_list_en[s];
		let skill_jp = skillMapJp.get(skill.skillMstId);

		html += `<tr>`;
		if (skill_jp) {
			html += `<td rowspan="2">${skill.skillMstId}</td>`;
		} else {
			html += `<td>${skill.skillMstId}</td>`;
		}
		html += `<td>${skill.name}</td>`;
		html += `<td>${skill.description}</td>`;
		html += `</tr>`;

		if (skill_jp) {
			html += `<tr>`;
			html += `<td>${skill_jp.name}</td>`;
			html += `<td>${skill_jp.description}</td>`;
			html += `</tr>`;
		}
	}
	html += '</tbody></table>';

	let content = document.getElementById("content");
	content.innerHTML = html;

	return "Datamine viewer - skills";
}

function viewWeaponmap(lists, isDebug) {
	// weaponssearch  | sino
	// ID             | cardMstId
	// UniqueID       | cardUniqueId

	// skill_mst_list[card_mst_list[ws.ID].frontSkillMstId].rates = ws.rate_text

	let weaponMap = new Map();
	let skillMap = new Map();
	{
		let card_mst_list_jp = lists.card_mst_list_jp;
		let card_mst_list_en = lists.card_mst_list_en;
		let ws_weapons = lists.weaponssearch_weapons;

		for (let i = 0; i < card_mst_list_jp.length; i++) {
			let entry = card_mst_list_jp[i];
			if (entry.cardType != cardType_weapon)
				continue;
			if (!weaponMap.has(entry.cardMstId)) {
				weaponMap.set(entry.cardMstId, { mst: entry, ws: null });
			} else {
				console.error(`duplicate cardMstId: ${entry.cardMstId}`);
			}
			if (!skillMap.has(entry.frontSkillMstId)) {
				skillMap.set(entry.frontSkillMstId, {jp: null, en: null, ws: null, blue: null});
			}
		}
		for (let i = 0; i < card_mst_list_en.length; i++) {
			let entry = card_mst_list_en[i];
			if (entry.cardType != cardType_weapon)
				continue;
			if (!skillMap.has(entry.frontSkillMstId)) {
				skillMap.set(entry.frontSkillMstId, {jp: null, en: null, ws: null, blue: null});
			}
		}

		for (let i = 0; i < ws_weapons.length; i++) {
			let wsEntry = ws_weapons[i];
			if (wsEntry.ID == "")
				continue;
			let id = Number(wsEntry.ID);
			let myEntry = weaponMap.get(id);
			if (myEntry) {
				myEntry.ws = wsEntry;
			} else {
				console.error(`unknown cardMstId in weaponssearch: ${wsEntry.ID}`);
				weaponMap.set(wsEntry.ID, { mst: null, ws: wsEntry });
			}
		}
	}

	{
		let skill_mst_list_jp = lists.skill_mst_list_jp;
		let skill_mst_list_en = lists.skill_mst_list_en;
		let skill_multipliers_blue = lists.skill_multipliers_blue;
		for (let i = 0; i < skill_mst_list_jp.length; i++) {
			let entry = skill_mst_list_jp[i];
			let myEntry = skillMap.get(entry.skillMstId);
			if (myEntry) {
				myEntry.jp = entry;
			}
		}
		for (let i = 0; i < skill_mst_list_en.length; i++) {
			let entry = skill_mst_list_en[i];
			let myEntry = skillMap.get(entry.skillMstId);
			if (myEntry) {
				myEntry.en = entry;
			}
		}
		for (const e of weaponMap.values()) {
			if (!e.ws || !e.ws.rate_text || !e.mst)
				continue;
			let myEntry = skillMap.get(e.mst.frontSkillMstId);
			if (myEntry.ws && myEntry.ws != e.ws.rate_text) {
				console.error(`Duplicate rate_text for skill ${e.mst.frontSkillMstId}: '${myEntry.ws}' vs. '${e.ws.rate_text}'`);
			}
			myEntry.ws = e.ws.rate_text;
		}
		for (let i = 0; i < skill_multipliers_blue.length; i++) {
			let e = skill_multipliers_blue[i];
			let skill = skillMap.get(e.skillMstId);
			if (skill) {
				skill.blue = e;
			}
		}
	}

	let skillList = [];
	for (const e of skillMap.values()) {
		skillList.push(e);
	}
	skillList.sort(function(a, b) {
		if (a.en && b.en) {
			if (a.en.name != b.en.name) {
				return a.en.name.localeCompare(b.en.name);
			}
			return a.en.cardMstId - b.en.cardMstId;
		} else if (a.en && !b.en) {
			return -1;
		} else {
			return 1;
		}
	});

	let html = "<h1>Skill map</h1>";
	html += '<table class="fixedHeader"><thead><tr>';
	html += '<th>skillMstId</th>';
	html += '<th>name</th>';
	html += '<th>description</th>';
	html += '<th>ws rates</th>';
	html += '<th>blue rates</th>'
	html += '</tr></thead><tbody>';

	for (let i = 0; i < skillList.length; i++) {
		let e = skillList[i];
		let id       = e.en ? e.en.skillMstId : e.jp.skillMstId;
		let en_name  = e.en ? e.en.name : "";
		let en_desc  = e.en ? e.en.description.replace("\\n", "<br>") : "";
		let jp_name  = e.jp ? e.jp.name : "";
		let jp_desc  = e.jp ? e.jp.description.replace("\\n", "<br>") : "";
		let ws_rates = e.ws ? e.ws : "";

		let blue_rates = '';
		if (e.blue) {
			let b = e.blue;
			let text = getMultiplierText(b, 'damage');
			if (text) blue_rates += `damage: ${text},`;
			text = getMultiplierText(b, 'recovery');
			if (text) blue_rates += `recovery: ${text},`;
			text = getMultiplierText(b, 'patk');
			if (text) blue_rates += `patk: ${text},`;
			text = getMultiplierText(b, 'matk');
			if (text) blue_rates += `matk: ${text},`;
			text = getMultiplierText(b, 'pdef');
			if (text) blue_rates += `pdef: ${text},`;
			text = getMultiplierText(b, 'mdef');
			if (text) blue_rates += `mdef: ${text},`;
		}

		html += `<tr>`;
		html += `<td rowspan=2>${id}</td>`;
		html += `<td>${en_name}</td>`
		html += `<td>${en_desc}</td>`
		html += `<td rowspan=2>${ws_rates}</td>`;
		html += `<td rowspan=2>${blue_rates}</td>`;
		html += `</tr>`;

		html += `<tr>`;
		html += `<td>${jp_name}</td>`;
		html += `<td>${jp_desc}</td>`;
		html += `<tr>`;
	}
	html += '</tbody></table>';

	let content = document.getElementById("content");
	content.innerHTML = html;

	return "Datamine viewer - skill map"
}

function viewGcStats(db) {
	let gc_stats = db.json.gc_stats;

	let generateTable = function(table) {
		let html = `<h2>${table.title}</h2>`;

		let thead = table.thead;
		let tbody = table.tbody;

		html += '<table><thead><tr>';
		for (let i = 0; i < thead.length; i++) {
			html += `<th>${thead[i]}</th>`;
		}
		html += '</tr></thead><tbody>';

		for (let r = 0; r < tbody.length; r++) {
			let row = tbody[r];
			html += '<tr>';
			for (let i = 0; i < row.length; i++) {
				html += `<td>${row[i]}</td>`
			}
			html += '</tr>';
		}

		html += `</tbody></table>`;
		return html;
	}

	let html = '<h1>GC stats</h1>';
	html += generateTable(gc_stats.guild_counts);
	html += generateTable(gc_stats.birth_death_17_18);
	html += generateTable(gc_stats.birth_death_16_17);
	html += generateTable(gc_stats.birth_death_15_16);
	html += generateTable(gc_stats.birth_death_14_15);
	html += generateTable(gc_stats.birth_death_13_14);
	html += generateTable(gc_stats.birth_death_12_13);
	html += generateTable(gc_stats.birth_death_11_12);

	let content = document.getElementById("content");
	content.innerHTML = html;

	return "Datamine viewer - GC stats";
}

function sanitizeVersion(version) {
	if (!version)
		return "EN";

	version = version.toUpperCase();
	if (version != "EN" && version != "JP")
		return "EN";

	return version;
}

function datamineJsonUrl(path) {
	return `https://raw.githubusercontent.com/sinoalice-datamine/data/master/${path}.json`;
}

async function showView(searchText) {
	let params = new URLSearchParams(searchText);
	let isDebug = params.has("debug");
	let version = sanitizeVersion(params.get("version"));
	let cardMstListName = "card_mst_list";
	if (version != "JP")
		cardMstListName += `_${version.toLowerCase()}`;

	let view = params.get("view");
	if (!view)
		view = '';

	let pageTitle;
	switch(view.toLowerCase())
	{
		case "classes":
		{
			const [characterMst, characterAbilityMst] = await Promise.allSettled([
				loadJson(db.json, datamineJsonUrl(`${version}/character_mst_list`)),
				loadJson(db.json, datamineJsonUrl(`${version}/character_ability_mst_list`)),
			]);
			pageTitle = viewClasses(db, characterMst.value, characterAbilityMst.value, isDebug);
		}
		break;

		case "weapons":
		{
			// JP skill multipliers (origin of values in Blue's sheets):
			//   https://script.google.com/macros/s/AKfycbzz_h3lGLUPMsSSfwvPZYQrj7r0cR2j0rdQ0YI7lC0prXc5Yrnj2ag9rrm_iPG-ZYfu/exec?callback=jsondata&_=1637531292144
			// TODO: Use these as source if possible. Requires checking whether skillMstId matches between
			// EN and JP or creating translation table of skill names (which kinda defeats the purpose).
			const [cardMst, skillMst, skillMultipliersBlue] = await Promise.allSettled([
				loadJson(db.json, datamineJsonUrl(`${version}/${cardMstListName}`)),
				loadJson(db.json, datamineJsonUrl(`${version}/skill_mst_list`)),
				loadJson(db.json, "https://script.google.com/macros/s/AKfycbz9EJA6OVAidLavVaP1GhDaTYaj-4hPE0K7YCbwaZZBrcG6SVKabKqTAsEkSrArTI8/exec"),
			])
			pageTitle = viewWeapons(version, db, cardMst.value, skillMst.value, skillMultipliersBlue.value, isDebug);
		}
		break;

		case "skills":
		{
			const [skillMstEn, skillMstJp] = await Promise.allSettled([
				loadJson(db.json, datamineJsonUrl("EN/skill_mst_list")),
				loadJson(db.json, datamineJsonUrl("JP/skill_mst_list")),
			]);
			pageTitle = viewSkills(skillMstEn.value, skillMstJp.value, isDebug);
		}
		break;

		case "weaponmap":
		{
			const results = await Promise.allSettled([
				loadJson(db.json, datamineJsonUrl("EN/skill_mst_list")),
				loadJson(db.json, datamineJsonUrl("JP/skill_mst_list")),
				loadJson(db.json, datamineJsonUrl("EN/card_mst_list_en")),
				loadJson(db.json, datamineJsonUrl("JP/card_mst_list")),
				loadJson(db.json, "https://script.google.com/macros/s/AKfycbz9EJA6OVAidLavVaP1GhDaTYaj-4hPE0K7YCbwaZZBrcG6SVKabKqTAsEkSrArTI8/exec"),
				loadJsonp(db.json, "https://script.google.com/macros/s/AKfycby0_uQ6iu9tuWckhDA5Me_rbEMl_ukAbphjw1lYIXH73qBV7c6tg35926Z3SXhCXj0zZA/exec"),
			]);
			const lists = {
				skill_mst_list_en: results[0].value,
				skill_mst_list_jp: results[1].value,
				card_mst_list_en: results[2].value,
				card_mst_list_jp: results[3].value,
				skill_multipliers_blue: results[4].value,
				weaponssearch_weapons: results[5].value,
			};
			pageTitle = viewWeaponmap(lists, isDebug);
		}
		break;

		case "nightmares":
		{
			const [cardMst, artMst] = await Promise.allSettled([
				loadJson(db.json, datamineJsonUrl(`${version}/${cardMstListName}`)),
				loadJson(db.json, datamineJsonUrl(`${version}/art_mst_list`)),
			]);
			pageTitle = viewNightmares(cardMst.value, artMst.value, isDebug);
		}
		break;

		default:
		{
			document.getElementById("content").innerHTML = "";
			pageTitle = "Datamine viewer";
		}
		break;
	}

	return pageTitle;
}

setupViewRequestHandler(showView);
