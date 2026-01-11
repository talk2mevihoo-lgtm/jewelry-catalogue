import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddCategoryForm, AddMaterialForm, AddMetalForm, AddSizeForm, DeleteItem, EditMaterialDialog, EditMetalDialog, ToggleMetalVisibility, ToggleMaterialVisibility } from "@/components/admin/settings-forms";
import { StageConfiguration } from "@/components/admin/stage-configuration";


export default async function SettingsPage() {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    const materials = await prisma.material.findMany({
        include: { metals: { orderBy: { conversionRatio: 'asc' } } },
        orderBy: { name: 'asc' }
    });
    const sizes = await prisma.size.findMany({ orderBy: { name: 'asc' } });
    const stages = await (prisma as any).orderStageDefinition.findMany({ orderBy: { sequence: 'asc' } });

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-primary font-serif">Configuration</h2>
                <p className="text-muted-foreground">Manage jewelry attributes, metals, and global settings.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Categories */}
                <Card>
                    <CardHeader>
                        <CardTitle>Jewelry Categories</CardTitle>
                        <CardDescription>Types of jewelry items available (e.g. Ring, Pendant)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {categories.map((c: any) => (
                                <div key={c.id} className="flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-600 border border-gold-200">
                                    {c.name}
                                    <DeleteItem id={c.id} type="category" />
                                </div>
                            ))}
                            {categories.length === 0 && <span className="text-sm text-muted-foreground italic">No categories yet.</span>}
                        </div>
                        <AddCategoryForm />
                    </CardContent>
                </Card>

                {/* Sizes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Size Registry</CardTitle>
                        <CardDescription>Available sizes for ordering.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2 mb-4 h-60 overflow-y-auto content-start">
                            {sizes.map((s: any) => (
                                <div key={s.id} className="flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-md text-xs font-medium bg-muted text-foreground border">
                                    <span>{s.name} <span className="text-[10px] opacity-50">({s.category})</span></span>
                                    <DeleteItem id={s.id} type="size" />
                                </div>
                            ))}
                            {sizes.length === 0 && <span className="text-sm text-muted-foreground italic">No sizes yet.</span>}
                        </div>
                        <AddSizeForm categories={categories} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Metal Configuration (Takes up 2 cols) */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Material & Metal Matrix</CardTitle>
                        <CardDescription>Define base materials and their metal variations with weight logic.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {materials.map((mat: any) => (
                            <div key={mat.id} className="border rounded-lg p-4 bg-card/50">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-lg flex items-center gap-2">
                                        {mat.name}
                                        {/* @ts-ignore */}
                                        {!mat.isVisible && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-normal">Hidden</span>}
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">Base Material</span>
                                        {mat.minOrderWeight > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-gold-100 text-gold-700 font-normal">Min: {mat.minOrderWeight}g</span>}
                                    </h4>
                                    <div className="flex items-center gap-1">
                                        <EditMaterialDialog material={{ id: mat.id, name: mat.name, minOrderWeight: mat.minOrderWeight }} />
                                        {/* @ts-ignore */}
                                        <ToggleMaterialVisibility id={mat.id} isVisible={mat.isVisible} />
                                        <DeleteItem id={mat.id} type="material" />
                                    </div>
                                </div>

                                <div className="space-y-2 pl-4 border-l-2 border-gold-200 ml-1">
                                    {mat.metals.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {mat.metals.map((metal: any) => (
                                                <div key={metal.id} className="flex items-center justify-between p-2 rounded bg-background border text-sm">
                                                    <div>
                                                        <span className="font-medium flex items-center gap-2">
                                                            {metal.name}
                                                            {!metal.isVisible && <span className="text-[10px] text-red-500 bg-red-50 px-1 rounded border border-red-100">Hidden</span>}
                                                        </span>
                                                        <div className="text-xs text-muted-foreground flex gap-3">
                                                            <span>Ratio: <span className="text-foreground font-mono">{metal.conversionRatio}</span></span>
                                                            {metal.purity > 0 && <span className="text-gold-600">Pure: {metal.purity}%</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <EditMetalDialog metal={{ id: metal.id, name: metal.name, conversionRatio: metal.conversionRatio, purity: metal.purity }} />
                                                        <ToggleMetalVisibility id={metal.id} isVisible={metal.isVisible} />
                                                        <DeleteItem id={metal.id} type="metal" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic py-2">No metal variations defined for this material.</p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {materials.length === 0 && <div className="text-center p-8 border-2 border-dashed rounded text-muted-foreground">Start by adding a Material Group below</div>}

                        <div className="pt-4 border-t">
                            <AddMetalForm materials={materials} />
                        </div>
                    </CardContent>
                </Card>

                {/* Add Material Group */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>New Material Group</CardTitle>
                        <CardDescription>Create a base material group (e.g. Gold, Silver, Wax).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AddMaterialForm />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <StageConfiguration stages={stages} />
            </div>
        </div>
    );
}
