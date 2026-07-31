import type { Metadata } from "next";
import { EditorialHomePage } from "@/components/store/EditorialHomePage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Home",
  description: "Discover Patch's upcycled clothing, limited-run pieces, and material-first story.",
};

export default EditorialHomePage;
