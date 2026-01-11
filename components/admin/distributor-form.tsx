"use client";

import { useFormState } from "react-dom";
import { createDistributor } from "@/lib/actions/distributor-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

const initialState = {
    message: "",
    errors: {},
};

export function DistributorForm() {
    // @ts-ignore - useFormState types can be tricky
    const [state, dispatch] = useFormState(createDistributor, initialState);
    const [loading, setLoading] = useState(false);

    return (
        <Card className="w-full max-w-2xl mx-auto border-gold-200">
            <CardHeader>
                <CardTitle>Add New Distributor</CardTitle>
                <CardDescription>Create a new distributor account with login access.</CardDescription>
            </CardHeader>
            <form action={(payload) => { setLoading(true); dispatch(payload); setLoading(false); }}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input id="companyName" name="companyName" placeholder="JewelSutra Pvt Ltd" required />
                            {state?.errors?.companyName && <p className="text-destructive text-xs">{state.errors.companyName}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="distributorCode">Distributor Code</Label>
                            <Input id="distributorCode" name="distributorCode" placeholder="DST-001" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contactPerson">Contact Person</Label>
                            <Input id="contactPerson" name="contactPerson" placeholder="John Doe" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactNo">Contact No</Label>
                            <Input id="contactNo" name="contactNo" placeholder="+91 80000 00000" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email ID (Login Username)</Label>
                            <Input id="email" name="email" type="email" placeholder="distributor@example.com" required />
                            {state?.errors?.email && <p className="text-destructive text-xs">{state.errors.email}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Login Password</Label>
                            <Input id="password" name="password" type="password" placeholder="******" required minLength={6} />
                            {state?.errors?.password && <p className="text-destructive text-xs">{state.errors.password}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Full Address</Label>
                        <Input id="address" name="address" placeholder="Unit 12, Gold Park..." required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="region">Region</Label>
                            <Input id="region" name="region" placeholder="Gujarat" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gstNo">GST No (Optional)</Label>
                            <Input id="gstNo" name="gstNo" placeholder="24AAAAA0000A1Z5" />
                        </div>
                    </div>

                    {state?.message && (
                        <div className={`p-3 rounded-md text-sm ${state.message.includes("success") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {state.message}
                        </div>
                    )}

                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" type="reset">Clear</Button>
                    <Button type="submit" variant="premium" disabled={loading}>
                        {loading ? "Creating..." : "Create Distributor"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
