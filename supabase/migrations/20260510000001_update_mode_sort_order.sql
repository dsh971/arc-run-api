-- Reorder modes: Shambler (easiest) → Extinction (hardest)
-- Special modes placed last
update public.modes set sort_order = case slug
  when 'shambler'     then 1
  when 'stalker'      then 2
  when 'feral'        then 3
  when 'swarm'        then 4
  when 'apex'         then 5
  when 'extinction'   then 6
  when 'un-grippable' then 7
  else sort_order
end;
