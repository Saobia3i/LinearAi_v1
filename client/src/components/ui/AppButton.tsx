import { Button as HeroButton } from "@heroui/react";
import type { ComponentProps } from "react";

type AppButtonProps = ComponentProps<typeof HeroButton>;

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function AppButton({ className, isIconOnly, ...props }: AppButtonProps) {
  return (
    <HeroButton
      {...props}
      isIconOnly={isIconOnly}
      className={joinClasses(
        "premium-button",
        isIconOnly ? "premium-button-icon-only" : "premium-button-with-content",
        className
      )}
    />
  );
}
