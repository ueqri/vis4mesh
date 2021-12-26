import { LabelBox } from "../../widget/labelbox";
import { RadioButtonGroup } from "../../widget/radiobutton";
import Ticker from "../../timebar/ticker";
import Filter from "../../controller/module/filter";
import { FilterBar } from "../../filterbar/filterbar";

export default function RenderSettingFilterSection(
  t: Ticker,
  filterBar: FilterBar,
  filterModule: Filter
) {
  return new LabelBox("filter-setting").append([
    {
      label: "Message Filter",
      widgets: [
        new RadioButtonGroup("filter-msg-radio")
          .append(["Groups", "Data/Command"])
          .switch("Groups")
          .event((v: string) => {
            t.signal["state"]("pause");
            console.log(v);
            if (v === "Groups") {
              filterModule.signal["msg"]("group");
              filterBar.signal["msg"]("group");
            } else if (v === "Data/Command") {
              filterModule.signal["msg"]("doc");
              filterBar.signal["msg"]("doc");
            } else {
              console.error(
                "internal error in radio for message filter setting"
              );
            }
          }),
      ],
    },
  ]);
}
