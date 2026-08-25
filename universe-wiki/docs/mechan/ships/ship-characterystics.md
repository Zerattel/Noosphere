# Характеристики и Тоннаж
<div class="hazard-line"></div>

Все числовые значения в таблице назначаются не каждому кораблю отдельно, а являются общими для каждого тоннажа. Считаются базовыми, т.е. Они могут быть изменены модулями, перками и навыками персонажей.
<div class="sci-fi-box">
  <strong>Чтобы узнать о своём типе корабля всю базу вам нужно узнать:</strong><br/><br/>
- Ряд этой таблице соответствующий тоннажу вашего корабля
- Характеристики вашего корабля из статьи справки о типе вашего корабля!
</div>

# Характеристики зависимые от тоннажа

| Тоннаж | Ускорение (ΔV/ход) | Манёвренность | Трюм (м³) | Дальность контакта | Разрешение сенсоров |
| :--- | :---: | :---: | :---: | :---: | :---: |
| <img src={require('@site/static/img/tonnage/Isis_shuttle.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> **Шаттл** | 240 | +5 | 5 | 5 км | 15 м |
| <img src={require('@site/static/img/tonnage/Isis_rookie.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> **Корвет** | 180 | +4 | 25 | 10 км | 20 м |
| <img src={require('@site/static/img/tonnage/Isis_frigate.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> **Фрегат** | 150 | +3 | 50 | 25 км | 30 м |
| <img src={require('@site/static/img/tonnage/Isis_destroyer.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> **Эсминец** | 120 | +2 | 75 | 35 км | 50 м |
| <img src={require('@site/static/img/tonnage/Isis_cruiser.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> **Крейсер** | 90 | +1 | 160 | 50 км | 100 м |
| <img src={require('@site/static/img/tonnage/Isis_battlecruiser.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> **Линейный крейсер** | 72 | 0 | 230 | 60 км | 140 м |
| <img src={require('@site/static/img/tonnage/Isis_battleship.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> **Линкор** | 54 | -2 | 620 | 100 км | 400 м |
| <img src={require('@site/static/img/tonnage/Isis_capital.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> **Дредноут** | 36 | -4 | 1 500 | 300 км | 600 м |
| <img src={require('@site/static/img/tonnage/Isis_supercarrier.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> **Корабль авт. развёртывания** | 18 | -6 | 3 500 | 500 км | 700 м |
| <img src={require('@site/static/img/tonnage/Isis_titan.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> **Титан** | 12 | -10 | 12 800 | 500 км | 800 м |
| <img src={require('@site/static/img/tonnage/unknown-mission.png').default} width="64" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> **Объяснение:** | <span class="tiny">То, на сколько вы можете ускориться за один ход</span> | <span class="tiny">Бонус к броску на маневрирование.</span> | <span class="tiny">Объём трюма</span> | <span class="tiny">Максимальная дистацния захвата цели</span> | <span class="tiny">Ожидаемый размер сигнатуры цели</span> |

> <span class="highlight">Важно:</span> *Разрешение* корабля для удобства выражено сразу в размере **ожидаемой** сигнатуры цели, т.е. точно так же как и с вашей собственной сигнатурой: Чем ниже тем лучше!
<div class="hazard-line"></div>

# Остальные характеристики кораблей

| Характеристика | <img src={require('@site/static/img/tonnage/unknown-mission.png').default} width="64" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> **Объяснение:** |
| :--- | :---: |
| <img src={require('@site/static/img/tonnage/Icon_damage_therm.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Температура (%) | То, насколько нагрет ваш корабль. |
| <img src={require('@site/static/img/tonnage/Icon_resist_therm.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Предел температуры (%) |  Предел, после которого ваш корабль начнёт получать урон от перегрева. По умолчанию 100% |
| <img src={require('@site/static/img/tonnage/Icon_capacitor_recharger.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Вместимость конденсатора (ГДж) | Грубо говоря "Очки действия" вашего корабля. Энергия накапливается в конденсаторе и если вы тратите больше энергии чем производите то будет затрачен заряд конденсатора. |
| <img src={require('@site/static/img/tonnage/Icon_ISIS_Energydestabilization.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Избыточная выработка (ГДж/Ход) | То, сколько энергии в ход вам даётся. Все излишки уходят в конденсатор. |
| Масса | Маса вашего корабля. Мало на что влияет. Нужна для рассчёта урона от тарана и оценки ваших шансов схлопнуть червоточину за собой. |
| <img src={require('@site/static/img/tonnage/Icon_ISIS_Tackling.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Радиус сигнатуры | То, насколько хорошо видно ваш корабль на системах слежения других кораблей. Чем меньше тем лучше. Прямо противопоставляется разрешению сенсоров захватывающего вас корабля.|
| <img src={require('@site/static/img/tonnage/32px-Icon_hull.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '1px' }} /><img src={require('@site/static/img/tonnage/Icon_armor.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '1px' }} /><img src={require('@site/static/img/tonnage/Icon_shield.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '1px' }} />Прочность | Условные единицы прочности трёх эшелонов защиты вашего корабля: <img src={require('@site/static/img/tonnage/32px-Icon_hull.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '1px' }} /> Корпус, <img src={require('@site/static/img/tonnage/Icon_armor.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '1px' }} /> Броня и <img src={require('@site/static/img/tonnage/Icon_shield.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '1px' }} /> Кинетический барьер |
| Сопротивляемость | Сопротивляемость каждого эшелона защиты <img src={require('@site/static/img/tonnage/32px-Icon_hull.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '1px' }} /><img src={require('@site/static/img/tonnage/Icon_armor.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '1px' }} /><img src={require('@site/static/img/tonnage/Icon_shield.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '1px' }} /> отдельно каждому из четырёх типов урона: <img src={require('@site/static/img/tonnage/Icon_resist_em.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '1px' }} /> Электромагнитному, <img src={require('@site/static/img/tonnage/Icon_resist_kin.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '1px' }} /> Кинетическому, <img src={require('@site/static/img/tonnage/Icon_resist_therm.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '1px' }} /> Термическому и <img src={require('@site/static/img/tonnage/Icon_resist_exp.png').default} width="32" height="auto" style={{ verticalAlign: 'middle', marginRight: '1px' }} /> Фугасному. Друг от друга они ничем принципиально не отличаются и просто противопоставляются характеру атаки противника. [Принцип работы модулей сопротивляемости описан здесь](404.md). |
