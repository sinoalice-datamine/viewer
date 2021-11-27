let db = {
	json: {
		loadingCount: 0,
		character_mst_list: null,
		character_ability_mst_list: null,
	},
	index: {
		characters: null,
		cards: null,
		skills: null,
	},
};

function viewClasses(db, isDebug) {
	let character_mst_list         = db.json.character_mst_list;
	let character_ability_mst_list = db.json.character_ability_mst_list;

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
		unitSections += `<section><h2>${v.mst.name}</h2>`;
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

		unitSections += '<table><tr>';
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
		unitSections += '</tr>';
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
		unitSections += '</table>';

		unitSections += '<table><tr>';
		unitSections += '<th>unlock</th>';
		unitSections += '<th>HP</th>';
		unitSections += '<th>patk</th>';
		unitSections += '<th>pdef</th>';
		unitSections += '<th>matk</th>';
		unitSections += '<th>mdef</th>';
		unitSections += '<th>cost</th>';
		unitSections += '</tr>';

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
		unitSections += '</table>';

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
}

function viewWeapons(version, db, isDebug, cardMstListName) {
	let card_mst_list = db.json[cardMstListName];
	let skill_mst_list = db.json.skill_mst_list;
	let skill_multipliers = db.json.skill_multipliers;

	const cardType_weapon = 1;
	const cardType_armor = 2;
	const cardType_nightmare = 3;
	const cardType_upgradeExp = 5; // upgrade sword/shield/tablet
	const cardType_gold = 6;
	const cardType_skillExp = 7; // gem (story, story support, colo, colo support)

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
	for (let i = 0; i < skill_multipliers.length; i++) {
		let mult = skill_multipliers[i];
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
	html += '<table><tr>';
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
	html += '</tr>';

	const rarityMap = ["D", "C", "B", "A", "S", "SR", "L", "LL"];

	const getMultiplierText = function(skill, multName) {
		let res = "";
		let mult = skill.mult;
		if (!mult)
			return res;

		if (mult.base && mult.base[multName]) {
			res += mult.base[multName];
		}

		if (mult.alt && mult.alt[multName]) {
			res += `(${mult.alt[multName]})`;
		}

		return res;
	};

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
				html += `<td>${getMultiplierText(frontSkill, 'damage')}</td>`;
				html += `<td>${getMultiplierText(frontSkill, 'recovery')}</td>`;
				html += `<td>${getMultiplierText(frontSkill, 'patk')}</td>`;
				html += `<td>${getMultiplierText(frontSkill, 'matk')}</td>`;
				html += `<td>${getMultiplierText(frontSkill, 'pdef')}</td>`;
				html += `<td>${getMultiplierText(frontSkill, 'mdef')}</td>`;
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
	html += '</table>';

	let content = document.getElementById("content");
	content.innerHTML = html;
}

function sanitizeVersion(version) {
	if (!version)
		return "EN";

	version = version.toUpperCase();
	if (version != "EN" && version != "JP")
		return "EN";

	return version;
}

function asyncLoadDatamineJson(version, name, onLoadingDone) {
	asyncLoadJson(
		`https://raw.githubusercontent.com/sinoalice-datamine/data/master/${version}/${name}.json`,
		name, onLoadingDone
	);
}

function asyncLoadJson(url, name, onLoadingDone) {
	db.json.loadingCount++;
	loadJSON(url, function(response) {
		db.json[name] = JSON.parse(response);
		const remaining = --db.json.loadingCount;
		if (remaining > 0)
			return;
		onLoadingDone(db);
	});
}

function loadJSON(path, callback) {
	let xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	xobj.open('GET', path, true);
	xobj.onreadystatechange = function () {
		if (xobj.readyState == 4 && xobj.status == "200") {
			callback(xobj.responseText);
		}
	};
	xobj.send(null);
}

function showCurrentView(db) {
	let params = new URLSearchParams(document.location.search);
	let isDebug = params.has("debug");
	let version = sanitizeVersion(params.get("version"));
	switch(params.get("view").toLowerCase()) {
		case "classes":
			let onLoadedClasses = function(db) {
				viewClasses(db, isDebug);
			};
			asyncLoadDatamineJson(version, "character_mst_list", onLoadedClasses);
			asyncLoadDatamineJson(version, "character_ability_mst_list", onLoadedClasses);
			break;

		case "weapons":
			let cardMstListName = "card_mst_list";
			if (version != "JP")
				cardMstListName += `_${version.toLowerCase()}`;
			let onLoadedCards = function(db) {
				viewWeapons(version, db, isDebug, cardMstListName);
			};
			asyncLoadDatamineJson(version, cardMstListName, onLoadedCards);
			asyncLoadDatamineJson(version, "skill_mst_list", onLoadedCards);
			// JP skill multipliers (origin of values in Blue's sheets):
			//   https://script.google.com/macros/s/AKfycbzz_h3lGLUPMsSSfwvPZYQrj7r0cR2j0rdQ0YI7lC0prXc5Yrnj2ag9rrm_iPG-ZYfu/exec?callback=jsondata&_=1637531292144
			// TODO: Use these as source if possible. Requires checking whether skillMstId matches between
			// EN and JP or creating translation table of skill names (which kinda defeats the purpose).
			asyncLoadJson(
				"https://script.google.com/macros/s/AKfycbz9EJA6OVAidLavVaP1GhDaTYaj-4hPE0K7YCbwaZZBrcG6SVKabKqTAsEkSrArTI8/exec",
				"skill_multipliers",
				onLoadedCards
			);
			break;
	}
}

window.addEventListener('load', function() {
	showCurrentView(db);
});

// function onHashChange() {
// 	let section = null;
// 	if (location.hash.startsWith("#") && location.hash.length > 1)
// 		section = document.getElementById(location.hash.slice(1));

// 	if (!section)
// 		section = document.getElementById("main");

// 	showSection(section);
// }
// window.addEventListener('hashchange', onHashChange);
