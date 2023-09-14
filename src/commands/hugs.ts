import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
  LazyPaginatedMessage,
  PaginatedMessageMessageOptionsUnion,
} from "@sapphire/discord.js-utilities";
import { Hug } from "../schemata/Hugs";
import { Colors, EmbedBuilder, UserResolvable, bold, userMention } from "discord.js";
import { PAGE_LEN } from "../consts";

@ApplyOptions<Subcommand.Options>({
  name: "hugs",
  description: "Manage hugs",
  subcommands: [
    { name: "give", chatInputRun: "chatInputGive" },
    { name: "list", chatInputRun: "chatInputList" },
  ],
})
export class UserCommand extends Subcommand {
  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((command) =>
          command
            .setName("give")
            .setDescription("Give someone a hug")
            .addUserOption((option) =>
              option.setName("target").setDescription("Whom to hug").setRequired(true)
            )
        )
        .addSubcommand((command) =>
          command.setName("list").setDescription("List the most hugged members")
        )
    );
  }

  public async chatInputGive(inter: Subcommand.ChatInputCommandInteraction) {
    const target = inter.options.getUser("target")!;
    if (target.id == inter.user.id) {
      const embed = new EmbedBuilder()
        .setDescription("Sadly, you cannot hug yourself. Find someone else to hug.")
        .setColor(Colors.Red);
      return inter.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    await Hug.findOneAndUpdate(
      { guildId: inter.guildId, userId: target.id },
      { $inc: { amount: 1 } },
      { upsert: true, new: true }
    );

    const embed = new EmbedBuilder()
      .setDescription(`You have given ${inter.user} a hug 🫂!`)
      .setColor(inter.client.color);
    return inter.reply({ embeds: [embed], ephemeral: true });
  }

  public async chatInputList(inter: Subcommand.ChatInputCommandInteraction) {
    const hugsCount = await Hug.count({ guildId: inter.guildId });

    const pages = Array.from({ length: Math.ceil(hugsCount / PAGE_LEN) }, (_v, i) => async () => {
      const offset = PAGE_LEN * i;
      const padding = formatIndex(Math.min(offset + PAGE_LEN, hugsCount)).length;
      const hugs = await Hug.find({ guildId: inter.guildId }).limit(PAGE_LEN).skip(offset);
      const embed = new EmbedBuilder()
        .setDescription(
          hugs
            .map((hug, j) => formatEntry(offset + j, hug.userId, `${hug.amount} 🫂`, padding))
            .join("\n")
        )
        .setColor(inter.client.color);

      const page: PaginatedMessageMessageOptionsUnion = { embeds: [embed] };
      return page;
    });

    const paginated = new LazyPaginatedMessage({ pages });
    await paginated.run(inter);
  }
}

function formatIndex(index: number, padding: number = 0) {
  return bold(`${index + 1}.`.padStart(padding));
}

function formatEntry(index: number, user: UserResolvable, value?: string, padding?: number) {
  const num = formatIndex(index, padding);
  const mention = userMention(typeof user == "string" ? user : user.id);
  return `${num} ${mention} ${value}`;
}
