import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { MANUAL, Lang, ManualBlock } from "@shared/manual-content";
import {
  BookOpen, Download, Search, ChevronRight, Info, AlertTriangle, Lightbulb, FileText,
} from "lucide-react";

const T = {
  search: { it: "Cerca nel manuale…", en: "Search the manual…" },
  download_full_it: { it: "Scarica PDF (Italiano)", en: "Download PDF (Italian)" },
  download_full_en: { it: "Scarica PDF (English)", en: "Download PDF (English)" },
  download_chapter: { it: "PDF di questo capitolo", en: "PDF of this chapter" },
  language: { it: "Lingua", en: "Language" },
  toc: { it: "Indice", en: "Table of Contents" },
  no_results: { it: "Nessun risultato.", en: "No results." },
  note: { it: "NOTA", en: "NOTE" },
  warn: { it: "ATTENZIONE", en: "WARNING" },
  tip: { it: "SUGGERIMENTO", en: "TIP" },
};

function highlightText(text: string, q: string) {
  if (!q.trim()) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(re);
  return parts.map((p, i) =>
    re.test(p) ? <mark key={i} className="bg-yellow-200">{p}</mark> : <span key={i}>{p}</span>
  );
}

function Block({ b, lang, q }: { b: ManualBlock; lang: Lang; q: string }) {
  switch (b.type) {
    case "h3":
      return <h3 className="text-base font-semibold mt-4 mb-1 text-blue-900">{highlightText(b.text![lang], q)}</h3>;
    case "p":
      return <p className="text-sm leading-relaxed text-gray-800 mb-3 text-justify">{highlightText(b.text![lang], q)}</p>;
    case "ul":
      return (
        <ul className="text-sm space-y-1 mb-3 list-disc pl-5">
          {b.items!.map((it, i) => <li key={i}>{highlightText(it[lang], q)}</li>)}
        </ul>
      );
    case "ol":
      return (
        <ol className="text-sm space-y-1 mb-3 list-decimal pl-5">
          {b.items!.map((it, i) => <li key={i}>{highlightText(it[lang], q)}</li>)}
        </ol>
      );
    case "note":
      return (
        <div className="flex gap-2 bg-blue-50 border-l-4 border-blue-400 p-3 my-3 text-sm rounded-r">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-blue-700 text-xs">{T.note[lang]}</strong>
            <p className="text-gray-800">{highlightText(b.text![lang], q)}</p>
          </div>
        </div>
      );
    case "warning":
      return (
        <div className="flex gap-2 bg-amber-50 border-l-4 border-amber-400 p-3 my-3 text-sm rounded-r">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-700 text-xs">{T.warn[lang]}</strong>
            <p className="text-gray-800">{highlightText(b.text![lang], q)}</p>
          </div>
        </div>
      );
    case "tip":
      return (
        <div className="flex gap-2 bg-emerald-50 border-l-4 border-emerald-400 p-3 my-3 text-sm rounded-r">
          <Lightbulb className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-emerald-700 text-xs">{T.tip[lang]}</strong>
            <p className="text-gray-800">{highlightText(b.text![lang], q)}</p>
          </div>
        </div>
      );
    case "code":
      return (
        <pre className="bg-slate-900 text-slate-100 text-xs p-3 rounded my-3 overflow-x-auto whitespace-pre-wrap font-mono">
          {b.text![lang]}
        </pre>
      );
    case "kvtable":
      return (
        <div className="overflow-x-auto my-3">
          <table className="w-full text-sm border border-gray-300">
            <tbody>
              {b.rows!.map((r, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="bg-gray-50 font-semibold text-blue-900 p-2 align-top w-1/3 border-r border-gray-300">
                    {highlightText(r.k[lang], q)}
                  </td>
                  <td className="p-2 align-top text-gray-800">{highlightText(r.v[lang], q)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

function blockMatches(b: ManualBlock, q: string, lang: Lang): boolean {
  if (!q.trim()) return true;
  const ql = q.toLowerCase();
  if (b.text?.[lang]?.toLowerCase().includes(ql)) return true;
  if (b.items?.some((it) => it[lang].toLowerCase().includes(ql))) return true;
  if (b.rows?.some((r) => r.k[lang].toLowerCase().includes(ql) || r.v[lang].toLowerCase().includes(ql))) return true;
  return false;
}

export default function Manuale() {
  const [lang, setLang] = useState<Lang>("it");
  const [activeId, setActiveId] = useState<string>(MANUAL[0].id);
  const [query, setQuery] = useState("");

  const filteredChapters = useMemo(() => {
    if (!query.trim()) return MANUAL;
    const ql = query.toLowerCase();
    return MANUAL.filter((ch) => {
      if (ch.title[lang].toLowerCase().includes(ql)) return true;
      if (ch.intro?.[lang]?.toLowerCase().includes(ql)) return true;
      return ch.sections.some((s) =>
        s.title[lang].toLowerCase().includes(ql) ||
        s.blocks.some((b) => blockMatches(b, query, lang))
      );
    });
  }, [query, lang]);

  const activeChapter = MANUAL.find((c) => c.id === activeId) ?? MANUAL[0];

  const downloadFull = (l: Lang) => window.open(`/api/imm/manual.pdf?lang=${l}`, "_blank");
  const downloadChapter = () => window.open(`/api/imm/manual.pdf?lang=${lang}&chapter=${activeChapter.id}`, "_blank");

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title={lang === "it" ? "Manuale FLUPSY Manager" : "FLUPSY Manager Manual"}
        description={
          lang === "it"
            ? "Guida operativa completa, bilingue. Naviga i capitoli a sinistra, cerca con il filtro o scarica il PDF."
            : "Complete bilingual operational guide. Navigate chapters on the left, use the filter or download the PDF."
        }
      />

      {/* Toolbar */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder={T.search[lang]}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{T.language[lang]}:</span>
              <Button
                size="sm"
                variant={lang === "it" ? "default" : "outline"}
                onClick={() => setLang("it")}
              >IT</Button>
              <Button
                size="sm"
                variant={lang === "en" ? "default" : "outline"}
                onClick={() => setLang("en")}
              >EN</Button>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => downloadFull("it")}>
                <Download className="h-4 w-4 mr-1" /> PDF IT
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadFull("en")}>
                <Download className="h-4 w-4 mr-1" /> PDF EN
              </Button>
              <Button size="sm" variant="secondary" onClick={downloadChapter}>
                <FileText className="h-4 w-4 mr-1" /> {T.download_chapter[lang]}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* TOC */}
        <Card className="lg:col-span-1 self-start lg:sticky lg:top-4 max-h-[calc(100vh-2rem)] overflow-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> {T.toc[lang]}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {filteredChapters.length === 0 ? (
              <p className="text-gray-500 text-xs">{T.no_results[lang]}</p>
            ) : (
              <ul className="space-y-1">
                {filteredChapters.map((ch, i) => (
                  <li key={ch.id}>
                    <button
                      onClick={() => setActiveId(ch.id)}
                      className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-1 ${
                        activeId === ch.id
                          ? "bg-blue-100 text-blue-900 font-semibold"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <ChevronRight className="h-3 w-3 shrink-0" />
                      <span className="truncate">{i + 1}. {ch.title[lang]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-xl text-blue-900">
              {activeChapter.title[lang]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeChapter.intro && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 italic text-sm text-blue-900 rounded-r">
                {highlightText(activeChapter.intro[lang], query)}
              </div>
            )}
            {activeChapter.sections.map((sec, si) => (
              <section key={sec.id} className="mb-6">
                <h2 className="text-lg font-bold text-blue-900 border-b-2 border-blue-200 pb-1 mb-3">
                  {MANUAL.findIndex(c => c.id === activeChapter.id) + 1}.{si + 1} {sec.title[lang]}
                </h2>
                {sec.blocks.map((b, bi) => <Block key={bi} b={b} lang={lang} q={query} />)}
              </section>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
