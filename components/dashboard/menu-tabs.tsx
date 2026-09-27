"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { MenuManager, type MenuItemRow } from "./menu-manager";
import { PackageManager, type PackageRow } from "./package-manager";

export function MenuTabs({ items, packages }: { items: MenuItemRow[]; packages: PackageRow[] }) {
  const [tab, setTab] = useState("items");

  return (
    <div>
      <Tabs
        className="mb-5"
        items={[
          { id: "items", label: "Menu items", count: items.length },
          { id: "packages", label: "Packages", count: packages.length },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === "items" ? <MenuManager items={items} /> : <PackageManager packages={packages} menuItems={items} />}
    </div>
  );
}
