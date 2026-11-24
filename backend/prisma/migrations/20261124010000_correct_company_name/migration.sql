UPDATE "Content" AS c
SET "draft" = CASE WHEN c."draft" ->> 'title' = names.old_title
                   THEN jsonb_set(c."draft", '{title}', to_jsonb(names.new_title))
                   ELSE c."draft" END,
    "published" = CASE WHEN c."published" ->> 'title' = names.old_title
                       THEN jsonb_set(c."published", '{title}', to_jsonb(names.new_title))
                       ELSE c."published" END,
    "updatedAt" = CURRENT_TIMESTAMP
FROM (VALUES
  ('en-US', 'Sepawe Sanat', 'Sepaveh Sanat Naghsh Jahan'),
  ('fa-IR', 'سپاوِه صنعت', 'سپاوه صنعت نقش جهان')
) AS names(locale, old_title, new_title)
WHERE c."type" = 'SETTINGS' AND c."slug" = 'site' AND c."locale" = names.locale
  AND (c."draft" ->> 'title' = names.old_title OR c."published" ->> 'title' = names.old_title);
